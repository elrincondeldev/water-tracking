# Gota: product requirements

Gota is a self-hosted smart coaster that tracks how much water one person drinks. A **node** (ESP32-S3 + HX711 + 10 kg load cell inside a 3D-printed base) weighs the bottle. The **API** turns weight changes into drinks, stores the full history and serves it to a **web app** and a **macOS menu bar app**. Everything runs on the local network, on a MacBook or on a ZimaBoard, with Docker.

This document is the source of truth for scope, architecture and roadmap. `docs/protocol.md` (created in Phase 1) is the source of truth for the node ↔ API contract.

## 1. Goals

- Know, without typing anything, how much water I drank today and on any past day.
- Set a daily goal and see progress toward it in a calm, beautiful, animated UI.
- Get gentle reminders on my Mac when I fall behind, and nothing when I don't.
- Manage the bottle: start counting with a new bottle, handle refills, fix wrong entries.
- Own the data: no cloud, no accounts, no telemetry. One `docker compose up` on the LAN.

## 2. Non-goals

- Multiple users, accounts, households or sharing.
- Cloud hosting, remote access from outside the LAN, sync services.
- Native iOS/Android apps. The web app must work well on a phone browser instead.
- Tracking drinks other than water from the bottle (manual entries cover the rest).
- Medical or hydration advice beyond a user-defined goal.
- Windows or Linux desktop apps.
- Third-party analytics, crash reporting or any outbound network call.

## 3. Validated baseline (Phase 0)

A working prototype exists and was tested with a real 1.5 L bottle on 2026-11-09.

| Fact | Value |
|---|---|
| Board | Generic ESP32-S3 DevKit, native USB (VID `0x303A`), Arduino-ESP32 3.3.10 |
| ADC | HX711 at 3.3 V, gain 128, channel A, ~10 Hz |
| Pins | DT/DOUT → GPIO4, SCK → GPIO5 |
| Load cell wires | red → E+, black → E−, green → A+, white → A− |
| Calibration factor | ~203.8 counts/g (device-specific, stored in NVS) |
| Noise at rest | ~40 counts (~0.2 g) |
| Accuracy | 1531 g reference reads 1530.3–1531.2 g |
| Position error | ±2 g across center/front/back/left/right |
| Empty plate after lifts | 0 ± 0.6 g |

The prototype sketches predated the repo, were written in Spanish and used the Arduino IDE layout. Phase 3 replaced them with the PlatformIO project in `firmware/`.

Lessons learned:

- A floating cover that rubs the base absorbs part of the load and makes readings depend on bottle position (90 g spread observed). The first check after any mechanical change is the five-position test.
- Calibrating while something rubs produces a wrong factor. Fix mechanics first, then tare, then calibrate.
- Never tare automatically at boot: the bottle may be on the plate.
- Water sloshes for ~1 s after placing the bottle. Decisions use only stable readings.

## 4. How a drink is detected

The node reports *what the scale sees*. The API decides *what it means*.

Node side (firmware):

- Sample the HX711 continuously; keep a ~1 s window.
- Stable means max − min < 3 g over the window, held for 1.5 s.
- Presence means stable weight ≥ 100 g.
- Emit `placed` (stable with bottle, after a removal or at boot), `removed` (any reading under the presence threshold), `changed` (bottle never lifted but stable weight moved ≥ 5 g for ≥ 5 s, e.g. refilling in place) and a periodic `status` heartbeat.
- Track the empty-plate zero slowly (±4 g band) to compensate drift.

API side (domain logic, pure and unit-tested):

- Compare each `placed`/`changed` weight with the last baseline of the active bottle.
- Drop of 5–600 g → **sip** of that many ml (1 g of water = 1 ml).
- Rise ≥ 5 g → **refill** (not counted).
- Drop > 600 g → **unclassified**: stays `pending` and is shown in the web app to confirm as drink or discard.
- Change < 5 g → no event.
- When a sip, refill or unclassified drop is recorded, the new weight becomes the baseline. Smaller changes keep the old baseline, so small sips add up.
- A **bottle reset** restarts counting without producing an intake: the bottle on the plate becomes the baseline, or, if the plate is empty, the next placement does.
- Raw node events are stored append-only. Intakes are derived and can be recomputed from raw events plus user corrections.

Thresholds live in one config module in each side and are covered by tests using recorded sessions.

## 5. Components

### 5.1 Node (firmware)

- PlatformIO, pioarduino platform (Arduino-ESP32 3.x), HX711 (bogde), ArduinoJson.
- Wi-Fi station. The clock is set from the `Date` header of API responses (no NTP: that would be a call to a third-party service). Events carry Unix time in ms when synced, plus `uptime_ms` and a monotonically increasing `seq` persisted across reboots.
- Sends events to the API over HTTP with a per-device bearer token.
- Offline queue in LittleFS. Events are delivered in order and are idempotent by `(device_id, seq)`. Nothing is lost when the API or Wi-Fi is down.
- Serial console (115200) for diagnostics, tare, calibration and Wi-Fi/API configuration. Credentials never live in the source tree.
- Status LED is optional; not required for v1.

### 5.2 API

- Node.js 24 LTS, TypeScript (strict), Fastify, zod (shared from `packages/contracts`), Drizzle ORM, SQLite (single file in a Docker volume).
- Endpoints (exact shapes live in `packages/contracts`):
  - `POST /api/v1/node/events`: batch ingest from the node, returns the highest accepted `seq`.
  - `GET /api/v1/summary/today`: total ml, goal, progress, last sip, current bottle weight.
  - `GET /api/v1/history?from=&to=&granularity=`: daily totals and individual intakes.
  - `POST /api/v1/intakes` / `PATCH` / `DELETE`: manual entries and corrections.
  - `POST /api/v1/bottle/reset`: start counting with a new or refilled bottle.
  - `GET`/`PUT /api/v1/goal`, `GET`/`PUT /api/v1/settings` (timezone, reminders, quiet hours).
  - `GET /api/v1/device`: online state, last seen, firmware, live weight.
  - `GET /api/v1/stream`: Server-Sent Events for live updates.
- Stores timestamps in UTC; aggregates days in the user's IANA timezone (default `Europe/Madrid`).
- No user authentication in v1: LAN-only, single user. Node ingest requires the device token.

### 5.3 Web app

- Vite, React 19, TypeScript (strict), Feature-Sliced Design, TanStack Query, React Router, Tailwind CSS, Motion for animation.
- Served as static files by nginx, which also proxies `/api` to the API.
- Screens:
  - **Today**: animated progress toward the goal (e.g. filling drop or ring), total ml, sips as a timeline, live bottle weight, last drink time.
  - **History**: day/week/month views, goal line, streaks, tap a day to see its sips.
  - **Bottle**: current baseline and weight, "reset bottle" (new bottle or full refill), optional bottle name/capacity.
  - **Review**: unclassified drops to confirm or discard; edit or delete any intake; add manual intakes.
  - **Settings**: daily goal, timezone, reminder rules, device status.
- Minimal and calm: lots of whitespace, one accent color, light and dark mode, `prefers-reduced-motion` respected, responsive down to phone width.

### 5.4 macOS app

- Tauri v2 + React + TypeScript, same FSD conventions and shared packages as the web app.
- Lives in the menu bar (no Dock icon). Clicking the icon opens a small popover anchored under it with today's total, progress toward the goal and the last few sips. Menu bar title can show a compact progress (e.g. `1.2 / 2 L`).
- Native notifications for reminders, computed locally from the live summary and settings:
  - No sip for N minutes during active hours.
  - Behind the expected pace for the time of day.
  - Silent during quiet hours, and never repeats a reminder while snoozed.
- Launch at login, configurable API URL, works offline (shows last known data, marks it stale).
- Not containerized: it is a native app that talks to the API over the LAN.

### 5.5 Deployment

- `docker-compose.yml` at the root runs `api` and `web`. Same file for MacBook (arm64) and ZimaBoard (x86_64); images build locally.
- SQLite file and config in a named volume. Backups are a copy of that file.
- The node is configured with the host's LAN address or mDNS name.

## 6. Data model (initial)

| Table | Purpose |
|---|---|
| `devices` | id, name, token hash, firmware version, last seen |
| `node_events` | append-only raw events: device, seq, type, weight_g, measured_at, received_at |
| `bottles` | id, name, capacity_ml, started_at, ended_at |
| `intakes` | derived or manual: kind (`sip`, `refill`, `unclassified`, `manual`), volume_ml, bottle, source event, occurred_at, status (`pending` until an unclassified drop is reviewed, then `counted` or `discarded`) |
| `goals` | daily_ml, effective_from |
| `settings` | timezone, reminder rules, quiet hours |

## 7. Repository layout

```
apps/
  api/          Fastify + Drizzle + SQLite
  web/          React web app (FSD)
  desktop/      Tauri v2 menu bar app (FSD)
  node-sim/     simulated node that replays fixtures/sessions against the API
packages/
  contracts/    zod schemas and types: node protocol and API DTOs
  api-client/   typed REST + SSE client used by web and desktop
  ui/           design tokens and shared presentational components
firmware/       PlatformIO project for the node
fixtures/
  sessions/     recorded node sessions (JSONL) used by tests and node-sim
docs/           protocol.md, hardware.md, deployment.md
docker-compose.yml
```

Monorepo with pnpm workspaces. Biome for lint and format, Vitest for tests, Steiger to enforce FSD boundaries.

## 8. Roadmap

Each phase ends with a check that proves it works. Don't start work that belongs to a later phase.

### Phase 0: hardware prototype (done)

Done when: the scale reads a known mass within 1 g and detects sips, refills and lifts without drinking on the real device. ✅

### Phase 1: foundations

- pnpm workspace, TypeScript strict base config, Biome, Vitest, Steiger, GitHub Actions running checks.
- `packages/contracts` with the node protocol v1 and core API DTOs.
- `docs/protocol.md` v1 and `docs/hardware.md` (wiring, assembly notes, calibration procedure).

Done when: `pnpm check` and `pnpm test` pass locally and in CI, and the protocol doc covers every event type with examples. ✅

### Phase 2: API, storage and simulator

- Ingest, domain logic (sip detection, bottle reset, daily aggregation in timezone), all read endpoints, SSE.
- `apps/node-sim` replaying `fixtures/sessions` (including the Phase 0 test sessions).
- Dockerfile for the API and `docker-compose.yml`.

Done when: replaying the recorded sessions produces exactly the expected sips/refills in tests, and `docker compose up` exposes a working API. ✅

### Phase 3: firmware node

- PlatformIO project ported from the prototype, in English.
- Wi-Fi, clock from the API, event reporting, offline queue, serial configuration.
- Delete the Arduino IDE prototypes.

Done when: real drinks appear in the API within seconds, and events produced while the API is stopped arrive in order after it restarts.

### Phase 4: web app

- Today, History, Bottle, Review and Settings screens with live updates.
- Served by the `web` container.

Done when: every action in section 5.3 works against the API with the real node or node-sim, in light and dark mode, on desktop and phone widths.

### Phase 5: macOS menu bar app

- Tauri popover, menu bar progress, reminders, launch at login.

Done when: the app shows live progress, sends a reminder after the configured idle time during active hours and stays silent during quiet hours.

### Phase 6: hardening

- Deployment guide for ZimaBoard, backups and restore, device health alerts in the UI.
- Tare and calibrate from the web (downlink to the node).
- OTA firmware updates.

Done when: a fresh ZimaBoard can be set up from the guide alone and a backup restores the full history.

## 9. Open questions

- Should the web app be installable as a PWA for the phone home screen?
- Apple Health export: out of scope for now; revisit after Phase 5.
- Bottle profiles (known empty weight per bottle) would allow showing "ml left in bottle". Decide in Phase 4.

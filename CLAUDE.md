# CLAUDE.md

Gota: a self-hosted smart coaster that tracks how much water one person drinks. A **node** (ESP32-S3 + HX711 + load cell) weighs the bottle and reports stable weights. An **API** (TypeScript, SQLite) turns them into drinks and stores the history. A **web app** and a **macOS menu bar app** (both React) show progress, goals and reminders. Everything runs on the LAN with Docker, on a MacBook or a ZimaBoard.

`REQUIREMENTS.md` is the source of truth for scope, architecture and roadmap. Read the relevant section before starting a task. `docs/protocol.md` is the source of truth for the node ↔ API contract.

**Current phase:** 6 (update this line as phases complete). Don't build anything that belongs to a later phase.

## Layout

- `firmware/`: PlatformIO, pioarduino (Arduino-ESP32 3.x), HX711 (bogde), ArduinoJson, LittleFS
- `apps/api/`: Node 24, Fastify, zod, Drizzle, SQLite
- `apps/web/`: Vite, React 19, TanStack Query, React Router, Tailwind, Motion. FSD.
- `apps/desktop/`: Tauri v2 + React menu bar app. FSD.
- `apps/node-sim/`: simulated node that replays `fixtures/sessions/` against the API
- `packages/contracts/`: zod schemas for the node protocol and API DTOs, shared by everything TS
- `packages/api-client/`: typed REST + SSE client. `packages/ui/`: design tokens and shared components.
- `docs/`: protocol, hardware, deployment

## Commands

```
pnpm install
pnpm dev                              # api + web in watch mode
pnpm check                            # biome + tsc + steiger
pnpm test                             # vitest, uses node-sim fixtures, no hardware
docker compose up -d --build          # api + web, web on http://localhost:8080
pnpm --filter desktop tauri dev       # macOS menu bar app
pio run -d firmware                   # build firmware
pio run -d firmware -t upload         # flash
pio device monitor -b 115200          # serial monitor
```

## Hard rules

- **English only in the repo**: code, identifiers, comments, docs, commit messages, UI copy. Talk to me in Spanish in chat.
- **No secrets in git.** The repo is public. Wi-Fi credentials, device tokens and LAN addresses go in gitignored files (`firmware/secrets.ini`, `.env`). Never commit personal drinking data; fixtures are anonymized sessions only.
- **No cloud, no telemetry.** No outbound calls to third-party services from any component.
- **Raw history is sacred.** `node_events` is append-only. Intakes are derived and recomputable. Never delete or rewrite user history except through an explicit user action.
- **Hardware safety:** the HX711 runs at 3.3 V from the ESP32; never feed a 5 V DOUT into a GPIO. Pins are DT → GPIO4, SCK → GPIO5. Never tare automatically at boot. Calibration lives in NVS, never hardcoded.
- **Only React + TypeScript for UI.** TypeScript strict everywhere, no `any`, no non-null assertions to silence the compiler.

## Architecture rules

- Dumb node, smart API. Firmware measures, stabilizes and reports presence and stable weights. Sip, refill and bottle logic lives in the API domain.
- Contracts first. Any node ↔ API change updates `docs/protocol.md` and `packages/contracts` first and bumps `v`. API DTOs are defined once in `packages/contracts` and inferred everywhere else.
- Domain logic is pure functions with no framework or I/O, tested against recorded sessions.
- Feature-Sliced Design in `web` and `desktop`: `app → pages → widgets → features → entities → shared`. Import only downward, only through each slice's `index.ts`. Steiger must pass. Shared packages count as the `shared` layer.
- Put units in names: `weight_g`, `volume_ml`, `t_ms`, `uptime_ms`, `rssi_dbm`. Store UTC, aggregate days in the user's timezone.
- Every API feature must be testable with `node-sim`, without hardware.

## Code style

- No comments unless the code can't explain itself (a hardware quirk, a non-obvious threshold).
- Small, named, single-purpose modules. Named exports. Files in kebab-case.
- Prefer composition and plain functions over classes and abstraction layers.
- UI: minimal and calm, one accent color, light and dark, animations that respect `prefers-reduced-motion`.
- Conventional Commits.

## Hardware gotchas

- Opening the serial port on macOS resets the ESP32-S3. Expect a reboot each time a monitor connects.
- If the board stays at `waiting for download` after flashing, press RESET or run `esptool --chip esp32s3 -p <port> --after watchdog-reset read-mac`.
- Board without firmware or with non-Arduino firmware may need manual download mode: hold BOOT, tap RESET, release BOOT.
- Readings that depend on bottle position mean something rubs the floating cover. Fix mechanics before calibrating.

## Working with me

You can't see the hardware. When a step depends on it, tell me exactly what to do and what to look for (serial output, weights, LED), then wait for my result. Explain embedded and hardware concepts briefly when they come up.

## Behavior

**Think before coding.** State your assumptions. If something is ambiguous, name it and ask instead of picking silently. If there is a simpler approach, say so.

**Simplicity first.** Write the minimum code that solves the problem. No speculative features, abstractions or configurability. If 200 lines could be 50, rewrite it.

**Surgical changes.** Touch only what the task needs and match the existing style. Mention unrelated issues instead of fixing them. Remove only the orphans your own change created.

**Goal-driven.** Turn each task into a check you can verify (a test, a serial output, a phase "Done when…" criterion). For multi-step work:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

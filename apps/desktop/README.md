# Gota for macOS

A menu bar app: today's progress in the menu bar, a popover with the drop and recent sips, and reminders as native notifications. It talks to the Gota API over the LAN.

## Run in development

```bash
pnpm --filter desktop tauri dev
```

The first build compiles the Rust side and takes a few minutes. `VITE_GOTA_API_URL` points it at another API. Notifications only work in the bundled app.

## Install

```bash
pnpm --filter desktop tauri build --bundles app
cp -R apps/desktop/src-tauri/target/release/bundle/macos/Gota.app /Applications/
```

Open Gota, click the drop in the menu bar, then ⚙︎ to set the API address (e.g. `http://192.168.1.10:3000`) and turn on "Open Gota at login". Allow notifications when macOS asks.

The app isn't signed, so the first time macOS may refuse to open it: right-click Gota.app → Open.

Reminders follow the settings in the web app (Settings → Day and reminders): idle time, pace reminders and quiet hours. "Pause 1 h" in the popover silences them for an hour.

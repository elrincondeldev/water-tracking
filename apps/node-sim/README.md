# node-sim

Replays recorded sessions from `fixtures/sessions/` against the API as if they came from a node, so every API feature can be tried without hardware.

```bash
pnpm --filter node-sim start --list
pnpm --filter node-sim start sips-and-refill emptied-bottle
pnpm --filter node-sim start --speed 60 refill-in-place
```

- The token comes from `--token` or `GOTA_DEVICE_TOKEN` (read from the root `.env`).
- `--url` defaults to `http://localhost:3000`; `--device` to `gota-sim`.
- With `--speed 0` (default) each session is sent at once and dated so it ends now. With `--speed n` events are sent one by one as they happen, `n` times faster than real time.
- Seqs start at the current Unix time in ms, so runs never collide with earlier ones. Sessions run back to back share the bottle state, like a real day.

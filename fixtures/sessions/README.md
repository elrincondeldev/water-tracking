# Recorded sessions

Each session is a pair of files:

- `<name>.jsonl`: node events in protocol v1 (`docs/protocol.md`), one JSON object per line, in `seq` order, as the node would send them.
- `<name>.expected.json`: the intakes the API must derive from them, as `{ "intakes": [{ "seq", "kind", "volume_ml" }] }`, where `seq` is the event that produced the intake.

`apps/api/test/sessions.test.ts` replays every session through the domain logic, and `node-sim` replays them against a running API.

The current sessions are synthetic, built from the Phase 0 measurements (1.5 L bottle, ±2 g position error). Recordings from the real node replace or join them once anonymized: keep only the events, never personal notes or LAN details.

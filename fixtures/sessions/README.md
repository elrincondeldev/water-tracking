# Recorded sessions

Each session is a pair of files:

- `<name>.jsonl`: node events in protocol v1 (`docs/protocol.md`), one JSON object per line, in `seq` order, as the node would send them.
- `<name>.expected.json`: the intakes the API must derive from them, as `{ "intakes": [{ "seq", "kind", "volume_ml" }] }`, where `seq` is the event that produced the intake.

`apps/api/test/sessions.test.ts` replays every session through the domain logic, and `node-sim` replays them against a running API.

Sessions without a prefix are synthetic, built from the Phase 0 measurements (1.5 L bottle, ±2 g position error). Recordings from the real node join them once anonymized: keep only the events, never personal notes or LAN details.

Sessions prefixed `recorded-` come from the Phase 0 prototype on 2026-11-09 with a real 1.5 L bottle, converted to protocol v1. `t_ms` is a fixed base plus the recorded uptime.

| Session | Source | What happened |
|---|---|---|
| `recorded-five-positions` | Diagnostic firmware, 2 Hz weight readings | Bottle placed at center, front, back, left, right and center again, no drinking. Raw counts rescaled with the final calibration factor. |
| `recorded-three-sips` | Diagnostic firmware, 2 Hz weight readings | Three sips, one of them large. |
| `recorded-sips-refill-and-lift` | Prototype tracking firmware events | Sip, lift without drinking, sip, refill, sip. |

For the two diagnostic sessions, `placed` and `removed` come from replaying the node rules over the readings: `removed` at the first reading under 100 g, `placed` once readings stay within 3 g for 2.5 s, with the mean of the last three readings as `weight_g`.

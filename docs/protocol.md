# Node protocol

This is the contract between the node (firmware) and the API. It is the source of truth: `packages/contracts/src/node-protocol.ts` implements it, and any change updates both and bumps `v`.

**Current version: `v: 1`.**

## Principles

- The node reports what the scale sees. It never decides what a weight change means: sips, refills and bottles are API concepts.
- Every event carries a `seq` that increases by one per event and survives reboots. Delivery is in order and idempotent by `(device_id, seq)`.
- The node keeps undelivered events in an offline queue and retries until the API acknowledges them. Nothing is dropped.

## Transport

```
POST /api/v1/node/events
Authorization: Bearer <device token>
Content-Type: application/json
```

- The token is per device, generated on the API side and entered on the node through the serial console. The API stores only its hash.
- The node sends events in batches of 1 to 50, oldest first, with `seq` strictly increasing within the batch.
- A heartbeat is a `status` event like any other: it goes through the same queue and the same request.

## Request

| Field | Type | Notes |
|---|---|---|
| `v` | `1` | Protocol version. |
| `device_id` | string | `gota-` + the lowercase Wi-Fi MAC without separators, e.g. `gota-3485180a1b2c`. 1 to 32 chars of `a-z`, `0-9`, `-`. |
| `firmware` | string | Firmware version, e.g. `1.0.0`. 1 to 32 chars. |
| `events` | array | 1 to 50 events, `seq` strictly increasing. |

## Events

Fields common to every event:

| Field | Type | Notes |
|---|---|---|
| `seq` | integer ≥ 1 | Per-device counter, persisted in NVS, never reused. |
| `type` | string | One of `placed`, `removed`, `changed`, `status`. |
| `t_ms` | integer or `null` | Unix time in ms when the event happened. `null` if the clock has not been set since boot (see [Clock](#clock)). |
| `uptime_ms` | integer ≥ 0 | Milliseconds since boot when the event happened. Lets the API order and date events whose `t_ms` is `null`. |

Weights are grams, rounded to 0.1 g, and come from the calibrated scale (mean of the stability window).

### `placed`

A stable weight at or above the presence threshold (100 g) appeared: after a `removed`, or as the first stable reading after boot.

| Field | Type | Notes |
|---|---|---|
| `weight_g` | number | Stable weight on the plate. |

```json
{ "seq": 41, "type": "placed", "t_ms": 1794225600000, "uptime_ms": 3605120, "weight_g": 1287.4 }
```

### `removed`

A reading dropped under the presence threshold while a bottle was on the plate. One unstable reading is enough: lifting is fast.

No extra fields.

```json
{ "seq": 40, "type": "removed", "t_ms": 1794225588000, "uptime_ms": 3593050 }
```

### `changed`

The bottle was never lifted, but its stable weight moved by 5 g or more from the last reported weight and stayed there for 5 s. Typical case: refilling the bottle in place.

| Field | Type | Notes |
|---|---|---|
| `weight_g` | number | New stable weight. |

```json
{ "seq": 42, "type": "changed", "t_ms": 1794225900000, "uptime_ms": 3905410, "weight_g": 1531.0 }
```

### `status`

Periodic heartbeat, every 60 s. Describes the node, not a weight change, so the API never derives intakes from it.

| Field | Type | Notes |
|---|---|---|
| `weight_g` | number | Current weight, stable or not. Can be slightly negative with an empty plate. |
| `stable` | boolean | Whether `weight_g` is stable. |
| `present` | boolean | Whether the node considers a bottle on the plate. |
| `calibrated` | boolean | Whether a calibration factor is stored. If `false`, weights are meaningless and no `placed`/`changed` events are emitted. |
| `rssi_dbm` | integer | Wi-Fi signal strength. |
| `queued` | integer ≥ 0 | Events waiting in the offline queue, this one excluded. |

```json
{
  "seq": 43,
  "type": "status",
  "t_ms": 1794225960000,
  "uptime_ms": 3965000,
  "weight_g": 1531.1,
  "stable": true,
  "present": true,
  "calibrated": true,
  "rssi_dbm": -58,
  "queued": 0
}
```

## Clock

The node has no NTP: it sets its clock from the `Date` header of API responses, which the API must send. After a boot, before sending its queue, the node makes one `GET /api/v1/settings` just to read that header, then fills in `t_ms` for every queued event of the current boot. Only events from an earlier boot that never got a clock are sent with `t_ms: null`; the API dates those from `uptime_ms` or the receive time. The header has one-second precision, which is enough for drinks.

## Response

`200 OK` once the API has durably stored the batch:

| Field | Type | Notes |
|---|---|---|
| `v` | `1` | Protocol version. |
| `accepted_seq` | integer ≥ 0 | Highest `seq` the API has stored for this device, from this batch or earlier ones. |

```json
{ "v": 1, "accepted_seq": 43 }
```

The node removes every queued event with `seq ≤ accepted_seq`.

The API ignores events whose `seq` it already stored, so resending a batch is safe. A gap in `seq` is accepted and logged: the API never blocks on a missing event.

## Errors

| Status | Meaning | Node behavior |
|---|---|---|
| `400` | Body does not match this document. | Keep the queue, retry with backoff, log over serial. A firmware fix is needed. |
| `401` | Missing or unknown token, or token does not match `device_id`. | Keep the queue, retry with backoff, log over serial. |
| `5xx`, timeout, no network | API or network unavailable. | Keep the queue, retry with backoff. |

Backoff starts at 1 s and doubles up to 60 s. Any `200` resets it.

## Full example

Bottle lifted, a sip taken, bottle put back:

```http
POST /api/v1/node/events
Authorization: Bearer 6f1c...e9
Content-Type: application/json

{
  "v": 1,
  "device_id": "gota-3485180a1b2c",
  "firmware": "1.0.0",
  "events": [
    { "seq": 40, "type": "removed", "t_ms": 1794225588000, "uptime_ms": 3593050 },
    { "seq": 41, "type": "placed", "t_ms": 1794225600000, "uptime_ms": 3605120, "weight_g": 1287.4 }
  ]
}
```

```json
{ "v": 1, "accepted_seq": 41 }
```

If the previous stable weight was 1531.0 g, the API sees a 243.6 g drop and counts it as a sip. That decision is described in `REQUIREMENTS.md` §4, not here.

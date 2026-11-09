import { describe, expect, it } from "vitest";
import { nodeEventBatchAckSchema, nodeEventBatchSchema, nodeEventSchema } from "./node-protocol";

const removed = { seq: 40, type: "removed", t_ms: 1794225588000, uptime_ms: 3593050 };
const placed = {
  seq: 41,
  type: "placed",
  t_ms: 1794225600000,
  uptime_ms: 3605120,
  weight_g: 1287.4,
};
const changed = {
  seq: 42,
  type: "changed",
  t_ms: 1794225900000,
  uptime_ms: 3905410,
  weight_g: 1531.0,
};
const status = {
  seq: 43,
  type: "status",
  t_ms: 1794225960000,
  uptime_ms: 3965000,
  weight_g: 1531.1,
  stable: true,
  present: true,
  calibrated: true,
  rssi_dbm: -58,
  queued: 0,
};

const batch = (events: unknown[], overrides: Record<string, unknown> = {}) => ({
  v: 1,
  device_id: "gota-3485180a1b2c",
  firmware: "1.0.0",
  events,
  ...overrides,
});

const withSeq = (seq: number) => ({ ...status, seq });

describe("nodeEventSchema", () => {
  it.each([removed, placed, changed, status])("accepts the documented $type example", (event) => {
    expect(nodeEventSchema.parse(event)).toEqual(event);
  });

  it("accepts an event without NTP time", () => {
    expect(nodeEventSchema.safeParse({ ...placed, t_ms: null }).success).toBe(true);
  });

  it("accepts a slightly negative status weight", () => {
    expect(nodeEventSchema.safeParse({ ...status, weight_g: -0.4 }).success).toBe(true);
  });

  it.each([
    ["an unknown type", { ...removed, type: "lifted" }],
    ["placed without weight", { ...placed, weight_g: undefined }],
    ["changed without weight", { ...changed, weight_g: undefined }],
    ["status without rssi", { ...status, rssi_dbm: undefined }],
    ["seq 0", { ...removed, seq: 0 }],
    ["a fractional seq", { ...removed, seq: 1.5 }],
    ["a negative uptime", { ...removed, uptime_ms: -1 }],
    ["a missing t_ms", { ...removed, t_ms: undefined }],
    ["a non-finite weight", { ...placed, weight_g: Number.POSITIVE_INFINITY }],
  ])("rejects %s", (_name, event) => {
    expect(nodeEventSchema.safeParse(event).success).toBe(false);
  });
});

describe("nodeEventBatchSchema", () => {
  it("accepts the documented full example", () => {
    const body = batch([removed, placed]);
    expect(nodeEventBatchSchema.parse(body)).toEqual(body);
  });

  it("accepts 50 events", () => {
    const events = Array.from({ length: 50 }, (_, i) => withSeq(i + 1));
    expect(nodeEventBatchSchema.safeParse(batch(events)).success).toBe(true);
  });

  it("accepts a gap in seq", () => {
    expect(nodeEventBatchSchema.safeParse(batch([withSeq(3), withSeq(7)])).success).toBe(true);
  });

  it.each([
    ["an unsupported version", batch([removed], { v: 2 })],
    ["no events", batch([])],
    ["51 events", batch(Array.from({ length: 51 }, (_, i) => withSeq(i + 1)))],
    ["a repeated seq", batch([withSeq(5), withSeq(5)])],
    ["a decreasing seq", batch([withSeq(6), withSeq(5)])],
    ["an uppercase device id", batch([removed], { device_id: "gota-3485180A1B2C" })],
    ["a device id over 32 chars", batch([removed], { device_id: `gota-${"a".repeat(28)}` })],
    ["an empty firmware", batch([removed], { firmware: "" })],
  ])("rejects %s", (_name, body) => {
    expect(nodeEventBatchSchema.safeParse(body).success).toBe(false);
  });
});

describe("nodeEventBatchAckSchema", () => {
  it("accepts the documented example", () => {
    expect(nodeEventBatchAckSchema.parse({ v: 1, accepted_seq: 43 })).toEqual({
      v: 1,
      accepted_seq: 43,
    });
  });

  it("accepts 0 before any event is stored", () => {
    expect(nodeEventBatchAckSchema.safeParse({ v: 1, accepted_seq: 0 }).success).toBe(true);
  });

  it("rejects a negative seq", () => {
    expect(nodeEventBatchAckSchema.safeParse({ v: 1, accepted_seq: -1 }).success).toBe(false);
  });
});

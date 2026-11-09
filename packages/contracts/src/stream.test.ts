import { describe, expect, it } from "vitest";
import { streamEventSchema } from "./stream";

describe("streamEventSchema", () => {
  it("accepts a new intake", () => {
    const event = {
      type: "intake",
      data: {
        id: 8,
        kind: "sip",
        status: "counted",
        volume_ml: 120,
        occurred_at: "2026-11-09T12:10:00.000Z",
        bottle_id: 2,
        source_event_id: 45,
      },
    };
    expect(streamEventSchema.parse(event)).toEqual(event);
  });

  it("rejects a payload that does not match its type", () => {
    expect(streamEventSchema.safeParse({ type: "device", data: { total_ml: 0 } }).success).toBe(
      false,
    );
  });
});

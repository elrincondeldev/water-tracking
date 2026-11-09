import { describe, expect, it } from "vitest";
import { createIntakeRequestSchema, intakeSchema, updateIntakeRequestSchema } from "./intake";

const sip = {
  id: 7,
  kind: "sip",
  status: "counted",
  volume_ml: 244,
  occurred_at: "2026-11-09T12:00:00.000Z",
  bottle_id: 2,
  source_event_id: 41,
};

describe("intakeSchema", () => {
  it("accepts a derived sip", () => {
    expect(intakeSchema.parse(sip)).toEqual(sip);
  });

  it("accepts a manual intake without bottle or source event", () => {
    const manual = { ...sip, kind: "manual", bottle_id: null, source_event_id: null };
    expect(intakeSchema.safeParse(manual).success).toBe(true);
  });

  it("accepts an unclassified drop waiting for review", () => {
    const drop = { ...sip, kind: "unclassified", status: "pending", volume_ml: 900 };
    expect(intakeSchema.safeParse(drop).success).toBe(true);
  });

  it("rejects an unknown kind", () => {
    expect(intakeSchema.safeParse({ ...sip, kind: "coffee" }).success).toBe(false);
  });
});

describe("createIntakeRequestSchema", () => {
  it("accepts a volume alone, defaulting the time on the API side", () => {
    expect(createIntakeRequestSchema.safeParse({ volume_ml: 250 }).success).toBe(true);
  });

  it("rejects a missing volume", () => {
    expect(createIntakeRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe("updateIntakeRequestSchema", () => {
  it.each([
    { status: "discarded" },
    { status: "counted" },
    { volume_ml: 300 },
    { occurred_at: "2026-11-09T08:00:00.000Z" },
  ])("accepts %o", (body) => {
    expect(updateIntakeRequestSchema.safeParse(body).success).toBe(true);
  });

  it.each([
    ["an empty update", {}],
    ["moving an intake back to pending", { status: "pending" }],
    ["changing the kind", { kind: "manual", volume_ml: 250 }],
  ])("rejects %s", (_name, body) => {
    expect(updateIntakeRequestSchema.safeParse(body).success).toBe(false);
  });
});

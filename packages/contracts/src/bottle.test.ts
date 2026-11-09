import { describe, expect, it } from "vitest";
import { bottleSchema, resetBottleRequestSchema } from "./bottle";

describe("bottleSchema", () => {
  it("accepts a fresh bottle waiting for its first placement", () => {
    const bottle = {
      id: 3,
      name: null,
      capacity_ml: null,
      started_at: "2026-11-09T12:00:00.000Z",
      ended_at: null,
      baseline_g: null,
    };
    expect(bottleSchema.parse(bottle)).toEqual(bottle);
  });
});

describe("resetBottleRequestSchema", () => {
  it("accepts an empty body", () => {
    expect(resetBottleRequestSchema.parse({})).toEqual({});
  });

  it("trims the name", () => {
    expect(resetBottleRequestSchema.parse({ name: "  Steel 1.5 L " })).toEqual({
      name: "Steel 1.5 L",
    });
  });

  it.each([
    ["a blank name", { name: "   " }],
    ["a tiny capacity", { capacity_ml: 10 }],
    ["an unknown field", { baseline_g: 500 }],
  ])("rejects %s", (_name, body) => {
    expect(resetBottleRequestSchema.safeParse(body).success).toBe(false);
  });
});

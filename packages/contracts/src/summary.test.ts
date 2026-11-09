import { describe, expect, it } from "vitest";
import { historyQuerySchema, historyResponseSchema, todaySummarySchema } from "./summary";

describe("todaySummarySchema", () => {
  const summary = {
    date: "2026-11-09",
    timezone: "Europe/Madrid",
    total_ml: 1240,
    goal_ml: 2000,
    progress: 0.62,
    last_intake_at: "2026-11-09T12:00:00.000Z",
    bottle_weight_g: 1287.4,
  };

  it("accepts a summary mid-day", () => {
    expect(todaySummarySchema.parse(summary)).toEqual(summary);
  });

  it("accepts a fresh day with no bottle on the plate", () => {
    const empty = {
      ...summary,
      total_ml: 0,
      progress: 0,
      last_intake_at: null,
      bottle_weight_g: null,
    };
    expect(todaySummarySchema.safeParse(empty).success).toBe(true);
  });

  it("accepts progress past the goal", () => {
    expect(todaySummarySchema.safeParse({ ...summary, progress: 1.3 }).success).toBe(true);
  });
});

describe("historyQuerySchema", () => {
  it("defaults granularity to day", () => {
    expect(historyQuerySchema.parse({ from: "2026-11-01", to: "2026-11-09" })).toEqual({
      from: "2026-11-01",
      to: "2026-11-09",
      granularity: "day",
      intakes: true,
    });
  });

  it("can leave the intakes out", () => {
    const query = { from: "2025-11-10", to: "2026-11-09", intakes: "false" };
    expect(historyQuerySchema.parse(query).intakes).toBe(false);
  });

  it("accepts a single day", () => {
    expect(historyQuerySchema.safeParse({ from: "2026-11-09", to: "2026-11-09" }).success).toBe(
      true,
    );
  });

  it.each([
    ["from after to", { from: "2026-11-10", to: "2026-11-09" }],
    ["an unknown granularity", { from: "2026-11-01", to: "2026-11-09", granularity: "year" }],
    ["a datetime instead of a date", { from: "2026-11-01T00:00:00Z", to: "2026-11-09" }],
  ])("rejects %s", (_name, query) => {
    expect(historyQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe("historyResponseSchema", () => {
  it("accepts weekly buckets with their intakes", () => {
    const response = {
      timezone: "Europe/Madrid",
      granularity: "week",
      buckets: [{ start: "2026-11-02", total_ml: 12100, goal_ml: 14000 }],
      intakes: [
        {
          id: 1,
          kind: "manual",
          status: "counted",
          volume_ml: 250,
          occurred_at: "2026-11-03T09:00:00.000Z",
          bottle_id: null,
          source_event_id: null,
        },
      ],
    };
    expect(historyResponseSchema.parse(response)).toEqual(response);
  });
});

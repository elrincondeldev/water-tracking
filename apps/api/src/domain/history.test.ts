import type { Goal, Intake } from "@gota/contracts";
import { describe, expect, it } from "vitest";
import { buildHistoryBuckets, countsTowardTotal, goalOn, localDate } from "./history";

const TZ = "Europe/Madrid";

let id = 0;
function intake(occurred_at: string, volume_ml: number, overrides: Partial<Intake> = {}): Intake {
  id += 1;
  return {
    id,
    kind: "sip",
    status: "counted",
    volume_ml,
    occurred_at,
    bottle_id: 1,
    source_event_id: id,
    ...overrides,
  };
}

const goals: Goal[] = [
  { daily_ml: 2000, effective_from: "2026-11-01" },
  { daily_ml: 2500, effective_from: "2026-11-05" },
];

describe("localDate", () => {
  it("uses the user's timezone, not UTC", () => {
    expect(localDate("2026-11-09T23:30:00.000Z", TZ)).toBe("2026-11-10");
    expect(localDate("2026-11-09T22:59:59.000Z", TZ)).toBe("2026-11-09");
  });

  it("follows daylight saving changes", () => {
    expect(localDate("2026-07-09T22:30:00.000Z", TZ)).toBe("2026-07-10");
  });
});

describe("countsTowardTotal", () => {
  it.each([
    [{ kind: "sip", status: "counted" }, true],
    [{ kind: "manual", status: "counted" }, true],
    [{ kind: "unclassified", status: "counted" }, true],
    [{ kind: "unclassified", status: "pending" }, false],
    [{ kind: "sip", status: "discarded" }, false],
    [{ kind: "refill", status: "counted" }, false],
  ] as const)("%o → %s", (fields, expected) => {
    expect(countsTowardTotal(intake("2026-11-09T10:00:00.000Z", 100, fields))).toBe(expected);
  });
});

describe("goalOn", () => {
  it("uses the goal in effect on that day", () => {
    expect(goalOn("2026-11-04", goals)).toBe(2000);
    expect(goalOn("2026-11-05", goals)).toBe(2500);
  });

  it("uses the first goal for days before it", () => {
    expect(goalOn("2026-10-01", goals)).toBe(2000);
  });

  it("is 0 without any goal", () => {
    expect(goalOn("2026-11-09", [])).toBe(0);
  });
});

describe("buildHistoryBuckets", () => {
  const intakes = [
    intake("2026-11-03T08:00:00.000Z", 300),
    intake("2026-11-03T23:30:00.000Z", 200),
    intake("2026-11-04T09:00:00.000Z", 900, { kind: "unclassified", status: "pending" }),
    intake("2026-11-05T12:00:00.000Z", 400, { kind: "manual", bottle_id: null }),
    intake("2026-11-10T12:00:00.000Z", 150),
  ];

  it("totals each local day and its goal", () => {
    const buckets = buildHistoryBuckets({
      from: "2026-11-03",
      to: "2026-11-05",
      granularity: "day",
      timezone: TZ,
      intakes,
      goals,
    });
    expect(buckets).toEqual([
      { start: "2026-11-03", total_ml: 300, goal_ml: 2000 },
      { start: "2026-11-04", total_ml: 200, goal_ml: 2000 },
      { start: "2026-11-05", total_ml: 400, goal_ml: 2500 },
    ]);
  });

  it("groups weeks from Monday, clipped to the range", () => {
    const buckets = buildHistoryBuckets({
      from: "2026-11-04",
      to: "2026-11-10",
      granularity: "week",
      timezone: TZ,
      intakes,
      goals,
    });
    expect(buckets).toEqual([
      { start: "2026-11-02", total_ml: 600, goal_ml: 2000 + 2500 * 4 },
      { start: "2026-11-09", total_ml: 150, goal_ml: 2500 * 2 },
    ]);
  });

  it("groups months", () => {
    const buckets = buildHistoryBuckets({
      from: "2026-10-31",
      to: "2026-11-02",
      granularity: "month",
      timezone: TZ,
      intakes,
      goals,
    });
    expect(buckets).toEqual([
      { start: "2026-10-01", total_ml: 0, goal_ml: 2000 },
      { start: "2026-11-01", total_ml: 0, goal_ml: 4000 },
    ]);
  });
});

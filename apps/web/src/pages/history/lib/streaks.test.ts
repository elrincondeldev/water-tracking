import { describe, expect, it } from "vitest";
import { computeStreaks } from "./streaks";

const day = (start: string, total_ml: number, goal_ml = 2000) => ({ start, total_ml, goal_ml });

describe("computeStreaks", () => {
  const days = [
    day("2026-11-01", 2100),
    day("2026-11-02", 2200),
    day("2026-11-03", 2000),
    day("2026-11-04", 900),
    day("2026-11-05", 2500),
    day("2026-11-06", 2050),
  ];

  it("counts back from yesterday while today is still open", () => {
    expect(computeStreaks([...days, day("2026-11-07", 600)], "2026-11-07")).toEqual({
      current: 2,
      best: 3,
    });
  });

  it("includes today once its goal is met", () => {
    expect(computeStreaks([...days, day("2026-11-07", 2000)], "2026-11-07").current).toBe(3);
  });

  it("breaks on a missed day before today", () => {
    expect(computeStreaks([...days, day("2026-11-07", 600)], "2026-11-08").current).toBe(0);
  });

  it("ignores days without a goal", () => {
    expect(computeStreaks([day("2026-11-07", 500, 0)], "2026-11-08")).toEqual({
      current: 0,
      best: 0,
    });
  });
});

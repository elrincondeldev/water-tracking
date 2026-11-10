import { describe, expect, it } from "vitest";
import { formatMenuBarTitle } from "./format-title";

const summary = (total_ml: number, goal_ml = 2000) => ({
  date: "2026-11-09",
  timezone: "Europe/Madrid",
  total_ml,
  goal_ml,
  progress: total_ml / goal_ml,
  last_intake_at: null,
  bottle_weight_g: null,
});

describe("formatMenuBarTitle", () => {
  it.each([
    [0, 2000, "0 / 2 L"],
    [1240, 2000, "1.2 / 2 L"],
    [1960, 2500, "2 / 2.5 L"],
    [2600, 2000, "2.6 / 2 L"],
  ])("%d of %d ml → %s", (total, goal, expected) => {
    expect(formatMenuBarTitle(summary(total, goal))).toBe(expected);
  });

  it("is empty before the first summary", () => {
    expect(formatMenuBarTitle(undefined)).toBe("");
  });
});

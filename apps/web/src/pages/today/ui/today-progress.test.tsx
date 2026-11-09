// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TodayProgress } from "./today-progress";

const summary = {
  date: "2026-11-09",
  timezone: "Europe/Madrid",
  total_ml: 1240,
  goal_ml: 2000,
  progress: 0.62,
  last_intake_at: null,
  bottle_weight_g: null,
};

describe("TodayProgress", () => {
  it("describes progress for screen readers", () => {
    render(<TodayProgress summary={summary} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      "1.24 L of 2 L, 62% of today's goal",
    );
    expect(screen.getByText("1.24 L")).toBeTruthy();
  });

  it("keeps counting past the goal", () => {
    render(<TodayProgress summary={{ ...summary, total_ml: 2600, progress: 1.3 }} />);
    expect(screen.getByText("of 2 L · 130%")).toBeTruthy();
  });
});

import { describe, expect, it } from "vitest";
import { periodFor } from "./period";

const TODAY = "2026-11-09";

describe("periodFor", () => {
  it("shows the last seven days and pages back by a week", () => {
    expect(periodFor("days", 0, TODAY)).toEqual({
      from: "2026-11-03",
      to: "2026-11-09",
      granularity: "day",
    });
    expect(periodFor("days", -1, TODAY).to).toBe("2026-11-02");
  });

  it("shows eight whole weeks ending today", () => {
    expect(periodFor("weeks", 0, "2026-11-11")).toEqual({
      from: "2026-09-21",
      to: "2026-11-11",
      granularity: "week",
    });
    expect(periodFor("weeks", -1, "2026-11-11")).toEqual({
      from: "2026-07-27",
      to: "2026-09-20",
      granularity: "week",
    });
  });

  it("shows six months ending today", () => {
    expect(periodFor("months", 0, TODAY)).toEqual({
      from: "2026-06-01",
      to: TODAY,
      granularity: "month",
    });
    expect(periodFor("months", -1, TODAY)).toEqual({
      from: "2025-12-01",
      to: "2026-05-31",
      granularity: "month",
    });
  });
});

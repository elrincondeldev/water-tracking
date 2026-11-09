import { describe, expect, it } from "vitest";
import { addDays, addMonths, daysBetween, formatDay, startOfMonth, startOfWeek } from "./dates";

describe("dates", () => {
  it("adds days across months", () => {
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("starts weeks on Monday", () => {
    expect(startOfWeek("2026-11-09")).toBe("2026-11-09");
    expect(startOfWeek("2026-11-15")).toBe("2026-11-09");
    expect(startOfWeek("2026-11-08")).toBe("2026-11-02");
  });

  it("moves between months from their first day", () => {
    expect(startOfMonth("2026-11-09")).toBe("2026-11-01");
    expect(addMonths("2026-11-30", -5)).toBe("2026-06-01");
    expect(addMonths("2026-11-09", 2)).toBe("2027-01-01");
  });

  it("counts days inclusively", () => {
    expect(daysBetween("2026-11-03", "2026-11-09")).toBe(7);
  });

  it("formats a calendar day without shifting it", () => {
    expect(formatDay("2026-11-09", { weekday: "short", day: "numeric", month: "short" })).toBe(
      "Mon 9 Nov",
    );
  });
});

import { describe, expect, it } from "vitest";
import { formatAgo, formatGrams, formatMl, formatTime, todayIn } from "./format";

describe("formatMl", () => {
  it.each([
    [0, "0 ml"],
    [244, "244 ml"],
    [999, "999 ml"],
    [1000, "1 L"],
    [1240, "1.24 L"],
    [1500, "1.5 L"],
    [2000, "2 L"],
  ])("%d ml → %s", (volume, expected) => {
    expect(formatMl(volume)).toBe(expected);
  });
});

describe("formatGrams", () => {
  it("rounds and groups thousands", () => {
    expect(formatGrams(1287.4)).toBe("1,287 g");
  });
});

describe("formatTime", () => {
  it("shows the time in the user's timezone", () => {
    expect(formatTime("2026-11-09T21:23:57.759Z", "Europe/Madrid")).toBe("22:23");
  });
});

describe("formatAgo", () => {
  const now = new Date("2026-11-09T22:00:00.000Z");
  it.each([
    ["2026-11-09T21:59:50.000Z", "just now"],
    ["2026-11-09T21:25:00.000Z", "35 min ago"],
    ["2026-11-09T19:45:00.000Z", "2 h 15 min ago"],
    ["2026-11-07T21:00:00.000Z", "2 d ago"],
  ])("%s → %s", (instant, expected) => {
    expect(formatAgo(instant, now)).toBe(expected);
  });
});

describe("todayIn", () => {
  it("uses the local date", () => {
    expect(todayIn("Europe/Madrid", new Date("2026-11-09T23:30:00.000Z"))).toBe("2026-11-10");
  });
});

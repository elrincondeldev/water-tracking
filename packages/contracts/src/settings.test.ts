import { describe, expect, it } from "vitest";
import { settingsSchema } from "./settings";

const settings = {
  timezone: "Europe/Madrid",
  reminders: { enabled: true, idle_min: 90, pace_enabled: true },
  quiet_hours: { start: "22:30", end: "08:00" },
};

describe("settingsSchema", () => {
  it("accepts quiet hours that cross midnight", () => {
    expect(settingsSchema.parse(settings)).toEqual(settings);
  });

  it.each([
    ["an unknown timezone", { ...settings, timezone: "Mars/Olympus" }],
    [
      "an idle time under 15 min",
      { ...settings, reminders: { ...settings.reminders, idle_min: 5 } },
    ],
    ["a malformed quiet hour", { ...settings, quiet_hours: { start: "10pm", end: "08:00" } }],
    ["a missing section", { timezone: "UTC", reminders: settings.reminders }],
  ])("rejects %s", (_name, body) => {
    expect(settingsSchema.safeParse(body).success).toBe(false);
  });
});

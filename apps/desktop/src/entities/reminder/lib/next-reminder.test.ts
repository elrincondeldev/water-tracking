import type { Settings, TodaySummary } from "@gota/contracts";
import { describe, expect, it } from "vitest";
import { nextReminder, type ReminderState } from "./next-reminder";

const settings: Settings = {
  timezone: "Europe/Madrid",
  reminders: { enabled: true, idle_min: 90, pace_enabled: true },
  quiet_hours: { start: "22:00", end: "08:00" },
};

const summary: TodaySummary = {
  date: "2026-11-10",
  timezone: "Europe/Madrid",
  total_ml: 1000,
  goal_ml: 2000,
  progress: 0.5,
  last_intake_at: "2026-11-10T11:00:00.000Z",
  bottle_weight_g: 1200,
};

const fresh: ReminderState = { lastReminderAt: null, snoozedUntil: null };

// Madrid is UTC+1 in November.
const at = (utc: string) => new Date(`2026-11-10T${utc}:00.000Z`);

function remind(now: Date, overrides: Partial<TodaySummary> = {}, more: Partial<Settings> = {}) {
  return nextReminder({
    now,
    summary: { ...summary, ...overrides },
    settings: { ...settings, ...more },
    state: fresh,
  });
}

describe("nextReminder", () => {
  it("stays quiet right after a drink", () => {
    expect(remind(at("11:30"))).toBeNull();
  });

  it("reminds after the idle time without a drink", () => {
    expect(remind(at("12:31"))).toEqual({
      kind: "idle",
      title: "Time for some water",
      body: "Nothing to drink for 1 h 31 min.",
    });
  });

  it("counts idle time from the end of quiet hours in the morning", () => {
    const yesterday = { last_intake_at: "2026-11-09T21:00:00.000Z", total_ml: 0 };
    expect(remind(at("08:00"), yesterday)).toBeNull();
    expect(remind(at("08:31"), yesterday)?.kind).toBe("idle");
  });

  it.each(["21:00", "23:30", "06:59"])("is silent during quiet hours at %s UTC", (time) => {
    expect(remind(at(time), { last_intake_at: null, total_ml: 0 })).toBeNull();
  });

  it("handles quiet hours that don't cross midnight", () => {
    const naps = { quiet_hours: { start: "13:00", end: "15:00" } };
    expect(remind(at("12:31"), {}, naps)).toBeNull();
    expect(remind(at("14:31"), {}, naps)).toBeNull();
    expect(remind(at("15:31"), {}, naps)?.kind).toBe("idle");
  });

  it("says nothing once the goal is met", () => {
    expect(remind(at("18:00"), { total_ml: 2000 })).toBeNull();
  });

  it("does nothing when reminders are off", () => {
    const off = { reminders: { ...settings.reminders, enabled: false } };
    expect(remind(at("18:00"), {}, off)).toBeNull();
  });

  it("warns when behind the day's pace", () => {
    const reminder = remind(at("16:00"), {
      total_ml: 600,
      last_intake_at: "2026-11-10T15:30:00.000Z",
    });
    expect(reminder?.kind).toBe("pace");
    expect(reminder?.body).toBe("About 690 ml behind your pace. A glass now catches you up.");
  });

  it("ignores a small shortfall and respects the pace switch", () => {
    const recent = { last_intake_at: "2026-11-10T15:30:00.000Z" };
    expect(remind(at("16:00"), { ...recent, total_ml: 1300 })).toBeNull();
    const noPace = { reminders: { ...settings.reminders, pace_enabled: false } };
    expect(remind(at("16:00"), { ...recent, total_ml: 600 }, noPace)).toBeNull();
  });

  it("does not repeat within the idle time or while snoozed", () => {
    const now = at("14:00");
    const base = { now, summary, settings };
    expect(
      nextReminder({
        ...base,
        state: { lastReminderAt: now.getTime() - 30 * 60_000, snoozedUntil: null },
      }),
    ).toBeNull();
    expect(
      nextReminder({
        ...base,
        state: { lastReminderAt: null, snoozedUntil: now.getTime() + 60_000 },
      }),
    ).toBeNull();
    expect(
      nextReminder({ ...base, state: { lastReminderAt: null, snoozedUntil: now.getTime() - 1 } })
        ?.kind,
    ).toBe("idle");
  });
});

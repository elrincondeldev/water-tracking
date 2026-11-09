import type { Settings, TodaySummary } from "@gota/contracts";
import { formatMl } from "@gota/ui";

const DAY_MINUTES = 24 * 60;
const MIN_BEHIND_ML = 250;

export type Reminder = { kind: "idle" | "pace"; title: string; body: string };

export type ReminderState = { lastReminderAt: number | null; snoozedUntil: number | null };

function minuteOfDay(now: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return value("hour") * 60 + value("minute");
}

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isQuiet(minute: number, start: number, end: number): boolean {
  if (start === end) return false;
  return start < end ? minute >= start && minute < end : minute >= start || minute < end;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function nextReminder({
  now,
  summary,
  settings,
  state,
}: {
  now: Date;
  summary: TodaySummary;
  settings: Settings;
  state: ReminderState;
}): Reminder | null {
  const { reminders, quiet_hours } = settings;
  const nowMs = now.getTime();
  if (!reminders.enabled) return null;
  if (state.snoozedUntil !== null && nowMs < state.snoozedUntil) return null;
  if (state.lastReminderAt !== null && nowMs - state.lastReminderAt < reminders.idle_min * 60_000) {
    return null;
  }
  if (summary.goal_ml > 0 && summary.total_ml >= summary.goal_ml) return null;

  const minute = minuteOfDay(now, settings.timezone);
  const quietStart = toMinutes(quiet_hours.start);
  const quietEnd = toMinutes(quiet_hours.end);
  if (isQuiet(minute, quietStart, quietEnd)) return null;

  const sinceDayStart = (minute - quietEnd + DAY_MINUTES) % DAY_MINUTES;
  const sinceDrink =
    summary.last_intake_at === null
      ? Number.POSITIVE_INFINITY
      : (nowMs - Date.parse(summary.last_intake_at)) / 60_000;
  const idle = Math.min(sinceDrink, sinceDayStart);
  if (idle >= reminders.idle_min) {
    return {
      kind: "idle",
      title: "Time for some water",
      body: `Nothing to drink for ${formatDuration(idle)}.`,
    };
  }

  if (reminders.pace_enabled) {
    const dayLength = (quietStart - quietEnd + DAY_MINUTES) % DAY_MINUTES || DAY_MINUTES;
    const expected_ml = summary.goal_ml * Math.min(sinceDayStart / dayLength, 1);
    const behind_ml = expected_ml - summary.total_ml;
    if (behind_ml >= Math.max(MIN_BEHIND_ML, summary.goal_ml * 0.1)) {
      return {
        kind: "pace",
        title: "A little behind today",
        body: `About ${formatMl(Math.round(behind_ml / 10) * 10)} behind your pace. A glass now catches you up.`,
      };
    }
  }
  return null;
}

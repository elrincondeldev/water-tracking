import { isNull } from "drizzle-orm";
import { localDate } from "../domain/history";
import type { Db } from "./open-database";
import { bottles, goals, settings } from "./schema";

export const DEFAULT_SETTINGS = {
  id: 1,
  timezone: "Europe/Madrid",
  reminders_enabled: true,
  reminders_idle_min: 90,
  reminders_pace_enabled: true,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
};

export const DEFAULT_DAILY_ML = 2000;

export function ensureDefaults(db: Db, now: Date): void {
  db.transaction((tx) => {
    tx.insert(settings).values(DEFAULT_SETTINGS).onConflictDoNothing().run();
    if (!tx.select().from(goals).limit(1).get()) {
      const effective_from = localDate(now.toISOString(), DEFAULT_SETTINGS.timezone);
      tx.insert(goals).values({ daily_ml: DEFAULT_DAILY_ML, effective_from }).run();
    }
    if (!tx.select().from(bottles).where(isNull(bottles.ended_at)).get()) {
      tx.insert(bottles).values({ started_at: now }).run();
    }
  });
}

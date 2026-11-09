import type { Settings } from "@gota/contracts";
import type { DbOrTx } from "../db/open-database";
import { settings } from "../db/schema";

export function getSettings(db: DbOrTx): Settings {
  const row = db.select().from(settings).get();
  if (!row) throw new Error("no settings; ensureDefaults must run at startup");
  return {
    timezone: row.timezone,
    reminders: {
      enabled: row.reminders_enabled,
      idle_min: row.reminders_idle_min,
      pace_enabled: row.reminders_pace_enabled,
    },
    quiet_hours: { start: row.quiet_hours_start, end: row.quiet_hours_end },
  };
}

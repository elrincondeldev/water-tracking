import type { PutSettingsRequest, Settings } from "@gota/contracts";
import type { Db } from "../db/open-database";
import { settings } from "../db/schema";
import { getSettings } from "./get-settings";

export function putSettings(db: Db, body: PutSettingsRequest): Settings {
  db.update(settings)
    .set({
      timezone: body.timezone,
      reminders_enabled: body.reminders.enabled,
      reminders_idle_min: body.reminders.idle_min,
      reminders_pace_enabled: body.reminders.pace_enabled,
      quiet_hours_start: body.quiet_hours.start,
      quiet_hours_end: body.quiet_hours.end,
    })
    .run();
  return getSettings(db);
}

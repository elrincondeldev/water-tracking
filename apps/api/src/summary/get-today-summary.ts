import type { TodaySummary } from "@gota/contracts";
import type { DbOrTx } from "../db/open-database";
import { loadTrackerState } from "../db/tracker-state";
import { localDate } from "../domain/history";
import { getHistory } from "../history/get-history";
import { lastCountedIntake } from "../intakes/list-intakes";
import { getSettings } from "../settings/get-settings";

export function getTodaySummary(db: DbOrTx, now: Date): TodaySummary {
  const { timezone } = getSettings(db);
  const date = localDate(now.toISOString(), timezone);
  const today = getHistory(db, { from: date, to: date, granularity: "day" }).buckets[0];
  const total_ml = today?.total_ml ?? 0;
  const goal_ml = today?.goal_ml ?? 0;
  const tracker = loadTrackerState(db);
  return {
    date,
    timezone,
    total_ml,
    goal_ml,
    progress: goal_ml > 0 ? total_ml / goal_ml : 0,
    last_intake_at: lastCountedIntake(db)?.occurred_at ?? null,
    bottle_weight_g: tracker.present ? tracker.last_weight_g : null,
  };
}

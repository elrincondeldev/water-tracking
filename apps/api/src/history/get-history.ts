import type { HistoryQuery, HistoryResponse } from "@gota/contracts";
import type { DbOrTx } from "../db/open-database";
import { utcWindowCovering } from "../domain/day-window";
import { buildHistoryBuckets, localDate } from "../domain/history";
import { listGoals } from "../goal/list-goals";
import { listIntakesBetween } from "../intakes/list-intakes";
import { getSettings } from "../settings/get-settings";

export function getHistory(db: DbOrTx, query: HistoryQuery): HistoryResponse {
  const { timezone } = getSettings(db);
  const window = utcWindowCovering(query.from, query.to);
  const intakes = listIntakesBetween(db, window.start, window.end).filter((intake) => {
    const day = localDate(intake.occurred_at, timezone);
    return day >= query.from && day <= query.to;
  });
  return {
    timezone,
    granularity: query.granularity,
    buckets: buildHistoryBuckets({ ...query, timezone, intakes, goals: listGoals(db) }),
    intakes: query.intakes ? intakes : [],
  };
}

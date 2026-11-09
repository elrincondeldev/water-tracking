import type { Goal, PutGoalRequest } from "@gota/contracts";
import type { Db } from "../db/open-database";
import { goals } from "../db/schema";
import { localDate } from "../domain/history";
import { getSettings } from "../settings/get-settings";

export function putGoal(db: Db, body: PutGoalRequest, now: Date): Goal {
  const effective_from = localDate(now.toISOString(), getSettings(db).timezone);
  db.insert(goals)
    .values({ daily_ml: body.daily_ml, effective_from })
    .onConflictDoUpdate({ target: goals.effective_from, set: { daily_ml: body.daily_ml } })
    .run();
  return { daily_ml: body.daily_ml, effective_from };
}

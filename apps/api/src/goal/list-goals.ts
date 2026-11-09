import type { Goal } from "@gota/contracts";
import { asc } from "drizzle-orm";
import type { DbOrTx } from "../db/open-database";
import { goals } from "../db/schema";

export function listGoals(db: DbOrTx): Goal[] {
  return db
    .select({ daily_ml: goals.daily_ml, effective_from: goals.effective_from })
    .from(goals)
    .orderBy(asc(goals.effective_from))
    .all();
}

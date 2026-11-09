import type { Bottle, ResetBottleRequest } from "@gota/contracts";
import { eq } from "drizzle-orm";
import type { Db, DbOrTx } from "../db/open-database";
import { bottles } from "../db/schema";
import { type ActiveBottle, getActiveBottle, loadTrackerState } from "../db/tracker-state";
import { resetBottle as resetTracker } from "../domain/bottle-tracker";

export function toBottle(row: ActiveBottle): Bottle {
  return {
    id: row.id,
    name: row.name,
    capacity_ml: row.capacity_ml,
    started_at: row.started_at.toISOString(),
    ended_at: row.ended_at?.toISOString() ?? null,
    baseline_g: row.baseline_g,
  };
}

export function getCurrentBottle(db: DbOrTx): Bottle {
  return toBottle(getActiveBottle(db));
}

export function resetBottle(db: Db, body: ResetBottleRequest, now: Date): Bottle {
  return db.transaction((tx) => {
    const { baseline_g } = resetTracker(loadTrackerState(tx));
    tx.update(bottles)
      .set({ ended_at: now })
      .where(eq(bottles.id, getActiveBottle(tx).id))
      .run();
    const row = tx
      .insert(bottles)
      .values({
        name: body.name ?? null,
        capacity_ml: body.capacity_ml ?? null,
        baseline_g,
        started_at: now,
      })
      .returning()
      .get();
    return toBottle(row);
  });
}

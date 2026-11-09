import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { BottleState } from "../domain/bottle-tracker";
import type { DbOrTx } from "./open-database";
import { bottles, nodeEvents } from "./schema";

export type ActiveBottle = typeof bottles.$inferSelect;

export function getActiveBottle(db: DbOrTx): ActiveBottle {
  const bottle = db.select().from(bottles).where(isNull(bottles.ended_at)).get();
  if (!bottle) throw new Error("no active bottle; ensureDefaults must run at startup");
  return bottle;
}

export function loadTrackerState(db: DbOrTx, device_id?: string): BottleState {
  const lastWeightEvent = db
    .select({ type: nodeEvents.type, weight_g: nodeEvents.weight_g })
    .from(nodeEvents)
    .where(
      and(
        inArray(nodeEvents.type, ["placed", "changed", "removed"]),
        device_id === undefined ? undefined : eq(nodeEvents.device_id, device_id),
      ),
    )
    .orderBy(desc(nodeEvents.id))
    .get();
  const present = lastWeightEvent !== undefined && lastWeightEvent.type !== "removed";
  return {
    baseline_g: getActiveBottle(db).baseline_g,
    present,
    last_weight_g: present ? (lastWeightEvent?.weight_g ?? null) : null,
  };
}

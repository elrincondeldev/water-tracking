import type { CreateIntakeRequest, Intake, UpdateIntakeRequest } from "@gota/contracts";
import { eq } from "drizzle-orm";
import type { Db } from "../db/open-database";
import { intakes } from "../db/schema";
import { toIntake } from "../db/to-intake";

export function createManualIntake(db: Db, body: CreateIntakeRequest, now: Date): Intake {
  const row = db
    .insert(intakes)
    .values({
      kind: "manual",
      status: "counted",
      volume_ml: body.volume_ml,
      occurred_at: body.occurred_at === undefined ? now : new Date(body.occurred_at),
      created_at: now,
      updated_at: now,
    })
    .returning()
    .get();
  return toIntake(row);
}

export function updateIntake(
  db: Db,
  id: number,
  body: UpdateIntakeRequest,
  now: Date,
): Intake | null {
  const row = db
    .update(intakes)
    .set({
      ...(body.volume_ml === undefined ? {} : { volume_ml: body.volume_ml }),
      ...(body.status === undefined ? {} : { status: body.status }),
      ...(body.occurred_at === undefined ? {} : { occurred_at: new Date(body.occurred_at) }),
      updated_at: now,
    })
    .where(eq(intakes.id, id))
    .returning()
    .get();
  return row ? toIntake(row) : null;
}

export function deleteIntake(db: Db, id: number, now: Date): boolean {
  const row = db.select({ kind: intakes.kind }).from(intakes).where(eq(intakes.id, id)).get();
  if (!row) return false;
  if (row.kind === "manual") {
    db.delete(intakes).where(eq(intakes.id, id)).run();
  } else {
    db.update(intakes)
      .set({ status: "discarded", updated_at: now })
      .where(eq(intakes.id, id))
      .run();
  }
  return true;
}

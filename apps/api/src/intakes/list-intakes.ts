import type { Intake } from "@gota/contracts";
import { and, asc, desc, eq, gte, lt, ne } from "drizzle-orm";
import type { DbOrTx } from "../db/open-database";
import { intakes } from "../db/schema";
import { toIntake } from "../db/to-intake";

export function listIntakesBetween(db: DbOrTx, from: Date, to: Date): Intake[] {
  return db
    .select()
    .from(intakes)
    .where(and(gte(intakes.occurred_at, from), lt(intakes.occurred_at, to)))
    .orderBy(asc(intakes.occurred_at), asc(intakes.id))
    .all()
    .map(toIntake);
}

export function lastCountedIntake(db: DbOrTx): Intake | null {
  const row = db
    .select()
    .from(intakes)
    .where(and(eq(intakes.status, "counted"), ne(intakes.kind, "refill")))
    .orderBy(desc(intakes.occurred_at))
    .get();
  return row ? toIntake(row) : null;
}

import type { Intake } from "@gota/contracts";
import type { intakes } from "./schema";

export function toIntake(row: typeof intakes.$inferSelect): Intake {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    volume_ml: row.volume_ml,
    occurred_at: row.occurred_at.toISOString(),
    bottle_id: row.bottle_id,
    source_event_id: row.source_event_id,
  };
}

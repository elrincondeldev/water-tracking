import type { Intake, NodeEvent, NodeEventBatch } from "@gota/contracts";
import { eq, max } from "drizzle-orm";
import type { Db, DbOrTx } from "../db/open-database";
import { bottles, devices, intakes, nodeEvents } from "../db/schema";
import { toIntake } from "../db/to-intake";
import { getActiveBottle, loadTrackerState } from "../db/tracker-state";
import { applyNodeEvent } from "../domain/bottle-tracker";
import { resolveMeasuredAt } from "../domain/resolve-measured-at";

export type IngestResult = { accepted_seq: number; intakes: Intake[] };

export function ingestBatch(db: Db, batch: NodeEventBatch, receivedAt: Date): IngestResult {
  return db.transaction((tx) => {
    upsertDevice(tx, batch, receivedAt);
    const storedSeq = maxStoredSeq(tx, batch.device_id);
    const measuredAtMs = resolveMeasuredAt(batch.events, receivedAt.getTime());
    const bottle = getActiveBottle(tx);
    let state = loadTrackerState(tx, batch.device_id);
    const created: Intake[] = [];

    batch.events.forEach((event, i) => {
      if (event.seq <= storedSeq) return;
      const occurredAt = new Date(measuredAtMs[i] ?? receivedAt.getTime());
      const eventId = insertEvent(tx, batch.device_id, event, occurredAt, receivedAt);
      const result = applyNodeEvent(state, event);
      state = result.state;
      if (!result.change) return;
      const row = tx
        .insert(intakes)
        .values({
          ...result.change,
          status: result.change.kind === "unclassified" ? "pending" : "counted",
          occurred_at: occurredAt,
          bottle_id: bottle.id,
          source_event_id: eventId,
          created_at: receivedAt,
          updated_at: receivedAt,
        })
        .returning()
        .get();
      created.push(toIntake(row));
    });

    tx.update(bottles).set({ baseline_g: state.baseline_g }).where(eq(bottles.id, bottle.id)).run();
    const lastSeq = batch.events.at(-1)?.seq ?? 0;
    return { accepted_seq: Math.max(storedSeq, lastSeq), intakes: created };
  });
}

function upsertDevice(db: DbOrTx, batch: NodeEventBatch, receivedAt: Date) {
  db.insert(devices)
    .values({
      id: batch.device_id,
      name: "Gota",
      firmware: batch.firmware,
      first_seen_at: receivedAt,
      last_seen_at: receivedAt,
    })
    .onConflictDoUpdate({
      target: devices.id,
      set: { firmware: batch.firmware, last_seen_at: receivedAt },
    })
    .run();
}

function maxStoredSeq(db: DbOrTx, device_id: string): number {
  const row = db
    .select({ seq: max(nodeEvents.seq) })
    .from(nodeEvents)
    .where(eq(nodeEvents.device_id, device_id))
    .get();
  return row?.seq ?? 0;
}

function insertEvent(
  db: DbOrTx,
  device_id: string,
  event: NodeEvent,
  measuredAt: Date,
  receivedAt: Date,
): number {
  return db
    .insert(nodeEvents)
    .values({
      device_id,
      seq: event.seq,
      type: event.type,
      weight_g: "weight_g" in event ? event.weight_g : null,
      t_ms: event.t_ms,
      uptime_ms: event.uptime_ms,
      measured_at: measuredAt,
      received_at: receivedAt,
      payload: event,
    })
    .returning({ id: nodeEvents.id })
    .get().id;
}

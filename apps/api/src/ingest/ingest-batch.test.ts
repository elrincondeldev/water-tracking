import type { NodeEvent, NodeEventBatch } from "@gota/contracts";
import { describe, expect, it } from "vitest";
import { testDatabase } from "../../test/database";
import { loadEvents, loadExpected, sessionNames } from "../../test/sessions";
import { nodeEvents } from "../db/schema";
import { getActiveBottle } from "../db/tracker-state";
import { ingestBatch } from "./ingest-batch";

const RECEIVED_AT = new Date("2026-11-09T12:30:00.000Z");

function batch(events: NodeEvent[]): NodeEventBatch {
  return { v: 1, device_id: "gota-3485180a1b2c", firmware: "1.0.0", events };
}

function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  );
}

describe("ingestBatch", () => {
  it.each(sessionNames)("derives the expected intakes from %s sent in batches", (name) => {
    const db = testDatabase();
    const events = loadEvents(name);
    const derived = chunks(events, 4).flatMap(
      (part) => ingestBatch(db, batch(part), RECEIVED_AT).intakes,
    );
    const seqById = new Map(
      db
        .select()
        .from(nodeEvents)
        .all()
        .map((e) => [e.id, e.seq]),
    );
    expect(
      derived.map((i) => ({
        seq: i.source_event_id === null ? null : seqById.get(i.source_event_id),
        kind: i.kind,
        volume_ml: i.volume_ml,
      })),
    ).toEqual(loadExpected(name));
  });

  it("is idempotent when a batch is resent", () => {
    const db = testDatabase();
    const events = loadEvents("sips-and-refill");
    const first = ingestBatch(db, batch(events.slice(0, 10)), RECEIVED_AT);
    const again = ingestBatch(db, batch(events.slice(0, 10)), RECEIVED_AT);
    expect(again).toEqual({ accepted_seq: first.accepted_seq, intakes: [] });
    expect(db.select().from(nodeEvents).all()).toHaveLength(10);
  });

  it("acknowledges the highest stored seq for a batch of old events", () => {
    const db = testDatabase();
    const events = loadEvents("sips-and-refill");
    ingestBatch(db, batch(events.slice(0, 10)), RECEIVED_AT);
    expect(ingestBatch(db, batch(events.slice(0, 3)), RECEIVED_AT).accepted_seq).toBe(
      events[9]?.seq,
    );
  });

  it("leaves unclassified drops pending review", () => {
    const db = testDatabase();
    const { intakes } = ingestBatch(db, batch(loadEvents("emptied-bottle")), RECEIVED_AT);
    expect(intakes.map((i) => [i.kind, i.status])).toEqual([
      ["unclassified", "pending"],
      ["sip", "counted"],
    ]);
  });

  it("dates intakes with the node clock and keeps the baseline", () => {
    const db = testDatabase();
    const events = loadEvents("refill-in-place");
    const { intakes } = ingestBatch(db, batch(events), RECEIVED_AT);
    const lastPlaced = events.findLast((e) => e.type === "placed");
    expect(intakes.at(-1)?.occurred_at).toBe(new Date(lastPlaced?.t_ms ?? 0).toISOString());
    expect(getActiveBottle(db).baseline_g).toBe(1301);
  });
});

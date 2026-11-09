import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { openDatabase } from "./open-database";
import { devices, nodeEvents } from "./schema";

function seedEvent() {
  const db = openDatabase(":memory:");
  const now = new Date();
  db.insert(devices)
    .values({ id: "gota-test", name: "Gota", first_seen_at: now, last_seen_at: now })
    .run();
  const event = { device_id: "gota-test", seq: 1, type: "removed" as const, uptime_ms: 1000 };
  db.insert(nodeEvents)
    .values({ ...event, measured_at: now, received_at: now, payload: event })
    .run();
  return { db, event, now };
}

describe("openDatabase", () => {
  it("applies the migrations", () => {
    const db = openDatabase(":memory:");
    const tables = db
      .all<{ name: string }>(sql`select name from sqlite_master where type = 'table' order by name`)
      .map((table) => table.name)
      .filter((name) => !name.startsWith("__") && !name.startsWith("sqlite_"));
    expect(tables).toEqual(["bottles", "devices", "goals", "intakes", "node_events", "settings"]);
  });

  it("rejects a second event with the same device and seq", () => {
    const { db, event, now } = seedEvent();
    expect(() =>
      db
        .insert(nodeEvents)
        .values({ ...event, measured_at: now, received_at: now, payload: event })
        .run(),
    ).toThrow(/UNIQUE/);
  });

  it("keeps node events append-only", () => {
    const { db } = seedEvent();
    expect(() => db.update(nodeEvents).set({ weight_g: 1 }).run()).toThrow(/append-only/);
    expect(() => db.delete(nodeEvents).run()).toThrow(/append-only/);
  });
});

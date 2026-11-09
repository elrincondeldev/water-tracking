import { ensureDefaults } from "../src/db/ensure-defaults";
import { openDatabase } from "../src/db/open-database";

export function testDatabase(now = new Date("2026-11-09T08:00:00.000Z")) {
  const db = openDatabase(":memory:");
  ensureDefaults(db, now);
  return db;
}

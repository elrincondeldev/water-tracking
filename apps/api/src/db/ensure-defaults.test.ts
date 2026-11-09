import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, ensureDefaults } from "./ensure-defaults";
import { openDatabase } from "./open-database";
import { bottles, goals, settings } from "./schema";

const NOW = new Date("2026-11-09T23:30:00.000Z");

describe("ensureDefaults", () => {
  it("creates settings, a goal from today and an active bottle", () => {
    const db = openDatabase(":memory:");
    ensureDefaults(db, NOW);
    expect(db.select().from(settings).all()).toEqual([DEFAULT_SETTINGS]);
    expect(db.select().from(goals).all()).toEqual([
      { id: 1, daily_ml: 2000, effective_from: "2026-11-10" },
    ]);
    expect(db.select().from(bottles).all()).toEqual([
      { id: 1, name: null, capacity_ml: null, baseline_g: null, started_at: NOW, ended_at: null },
    ]);
  });

  it("leaves existing data alone", () => {
    const db = openDatabase(":memory:");
    ensureDefaults(db, NOW);
    db.update(settings).set({ timezone: "UTC" }).run();
    ensureDefaults(db, new Date("2026-12-01T00:00:00.000Z"));
    expect(db.select().from(settings).get()?.timezone).toBe("UTC");
    expect(db.select().from(goals).all()).toHaveLength(1);
    expect(db.select().from(bottles).all()).toHaveLength(1);
  });
});

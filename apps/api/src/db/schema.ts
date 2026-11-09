import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestampMs = (name: string) => integer(name, { mode: "timestamp_ms" });

export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  firmware: text("firmware"),
  first_seen_at: timestampMs("first_seen_at").notNull(),
  last_seen_at: timestampMs("last_seen_at").notNull(),
});

export const nodeEvents = sqliteTable(
  "node_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    device_id: text("device_id")
      .notNull()
      .references(() => devices.id),
    seq: integer("seq").notNull(),
    type: text("type", { enum: ["placed", "removed", "changed", "status"] }).notNull(),
    weight_g: real("weight_g"),
    t_ms: integer("t_ms"),
    uptime_ms: integer("uptime_ms").notNull(),
    measured_at: timestampMs("measured_at").notNull(),
    received_at: timestampMs("received_at").notNull(),
    payload: text("payload", { mode: "json" }).notNull(),
  },
  (table) => [
    uniqueIndex("node_events_device_seq").on(table.device_id, table.seq),
    index("node_events_device_type").on(table.device_id, table.type, table.seq),
  ],
);

export const bottles = sqliteTable("bottles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  capacity_ml: integer("capacity_ml"),
  baseline_g: real("baseline_g"),
  started_at: timestampMs("started_at").notNull(),
  ended_at: timestampMs("ended_at"),
});

export const intakes = sqliteTable(
  "intakes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["sip", "refill", "unclassified", "manual"] }).notNull(),
    status: text("status", { enum: ["pending", "counted", "discarded"] }).notNull(),
    volume_ml: integer("volume_ml").notNull(),
    occurred_at: timestampMs("occurred_at").notNull(),
    bottle_id: integer("bottle_id").references(() => bottles.id),
    source_event_id: integer("source_event_id").references(() => nodeEvents.id),
    created_at: timestampMs("created_at").notNull(),
    updated_at: timestampMs("updated_at").notNull(),
  },
  (table) => [
    index("intakes_occurred_at").on(table.occurred_at),
    uniqueIndex("intakes_source_event").on(table.source_event_id),
  ],
);

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  daily_ml: integer("daily_ml").notNull(),
  effective_from: text("effective_from").notNull().unique(),
});

export const settings = sqliteTable(
  "settings",
  {
    id: integer("id").primaryKey(),
    timezone: text("timezone").notNull(),
    reminders_enabled: integer("reminders_enabled", { mode: "boolean" }).notNull(),
    reminders_idle_min: integer("reminders_idle_min").notNull(),
    reminders_pace_enabled: integer("reminders_pace_enabled", { mode: "boolean" }).notNull(),
    quiet_hours_start: text("quiet_hours_start").notNull(),
    quiet_hours_end: text("quiet_hours_end").notNull(),
  },
  (table) => [check("settings_single_row", sql`${table.id} = 1`)],
);

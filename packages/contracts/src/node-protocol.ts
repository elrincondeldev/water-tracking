import { z } from "zod";

export const NODE_PROTOCOL_VERSION = 1;
export const NODE_EVENT_BATCH_MAX = 50;

const seqSchema = z.int().min(1);

const eventBaseSchema = z.object({
  seq: seqSchema,
  t_ms: z.int().min(0).nullable(),
  uptime_ms: z.int().min(0),
});

export const placedEventSchema = eventBaseSchema.extend({
  type: z.literal("placed"),
  weight_g: z.number(),
});

export const removedEventSchema = eventBaseSchema.extend({
  type: z.literal("removed"),
});

export const changedEventSchema = eventBaseSchema.extend({
  type: z.literal("changed"),
  weight_g: z.number(),
});

export const statusEventSchema = eventBaseSchema.extend({
  type: z.literal("status"),
  weight_g: z.number(),
  stable: z.boolean(),
  present: z.boolean(),
  calibrated: z.boolean(),
  rssi_dbm: z.int(),
  queued: z.int().min(0),
});

export const nodeEventSchema = z.discriminatedUnion("type", [
  placedEventSchema,
  removedEventSchema,
  changedEventSchema,
  statusEventSchema,
]);

export const nodeEventBatchSchema = z.object({
  v: z.literal(NODE_PROTOCOL_VERSION),
  device_id: z.string().regex(/^[a-z0-9-]{1,32}$/),
  firmware: z.string().min(1).max(32),
  events: z
    .array(nodeEventSchema)
    .min(1)
    .max(NODE_EVENT_BATCH_MAX)
    .refine(
      (events) => events.every((event, i) => i === 0 || event.seq > (events[i - 1]?.seq ?? 0)),
      {
        message: "seq must be strictly increasing",
      },
    ),
});

export const nodeEventBatchAckSchema = z.object({
  v: z.literal(NODE_PROTOCOL_VERSION),
  accepted_seq: z.int().min(0),
});

export type PlacedEvent = z.infer<typeof placedEventSchema>;
export type RemovedEvent = z.infer<typeof removedEventSchema>;
export type ChangedEvent = z.infer<typeof changedEventSchema>;
export type StatusEvent = z.infer<typeof statusEventSchema>;
export type NodeEvent = z.infer<typeof nodeEventSchema>;
export type NodeEventType = NodeEvent["type"];
export type NodeEventBatch = z.infer<typeof nodeEventBatchSchema>;
export type NodeEventBatchAck = z.infer<typeof nodeEventBatchAckSchema>;

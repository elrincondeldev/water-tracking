import { z } from "zod";
import { intakeSchema } from "./intake";
import { isoDateSchema, isoDateTimeSchema, timezoneSchema } from "./primitives";

const totalMlSchema = z.int().min(0);

export const todaySummarySchema = z.object({
  date: isoDateSchema,
  timezone: timezoneSchema,
  total_ml: totalMlSchema,
  goal_ml: totalMlSchema,
  progress: z.number().min(0),
  last_intake_at: isoDateTimeSchema.nullable(),
  bottle_weight_g: z.number().nullable(),
});

export const historyGranularitySchema = z.enum(["day", "week", "month"]);

export const historyQuerySchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
    granularity: historyGranularitySchema.default("day"),
  })
  .refine((query) => query.from <= query.to, { message: "from must not be after to" });

export const historyBucketSchema = z.object({
  start: isoDateSchema,
  total_ml: totalMlSchema,
  goal_ml: totalMlSchema,
});

export const historyResponseSchema = z.object({
  timezone: timezoneSchema,
  granularity: historyGranularitySchema,
  buckets: z.array(historyBucketSchema),
  intakes: z.array(intakeSchema),
});

export type TodaySummary = z.infer<typeof todaySummarySchema>;
export type HistoryGranularity = z.infer<typeof historyGranularitySchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
export type HistoryBucket = z.infer<typeof historyBucketSchema>;
export type HistoryResponse = z.infer<typeof historyResponseSchema>;

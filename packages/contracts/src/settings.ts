import { z } from "zod";
import { timeOfDaySchema, timezoneSchema } from "./primitives";

export const settingsSchema = z.strictObject({
  timezone: timezoneSchema,
  reminders: z.strictObject({
    enabled: z.boolean(),
    idle_min: z.int().min(15).max(480),
    pace_enabled: z.boolean(),
  }),
  quiet_hours: z.strictObject({
    start: timeOfDaySchema,
    end: timeOfDaySchema,
  }),
});

export const putSettingsRequestSchema = settingsSchema;

export type Settings = z.infer<typeof settingsSchema>;
export type PutSettingsRequest = z.infer<typeof putSettingsRequestSchema>;

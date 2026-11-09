import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./primitives";

const bottleNameSchema = z.string().trim().min(1).max(40);
const capacityMlSchema = z.int().min(50).max(5000);

export const bottleSchema = z.object({
  id: idSchema,
  name: bottleNameSchema.nullable(),
  capacity_ml: capacityMlSchema.nullable(),
  started_at: isoDateTimeSchema,
  ended_at: isoDateTimeSchema.nullable(),
  baseline_g: z.number().nullable(),
});

export const resetBottleRequestSchema = z.strictObject({
  name: bottleNameSchema.optional(),
  capacity_ml: capacityMlSchema.optional(),
});

export type Bottle = z.infer<typeof bottleSchema>;
export type ResetBottleRequest = z.infer<typeof resetBottleRequestSchema>;

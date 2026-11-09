import { z } from "zod";
import { idSchema, isoDateTimeSchema, volumeMlSchema } from "./primitives";

export const intakeKindSchema = z.enum(["sip", "refill", "unclassified", "manual"]);
export const intakeStatusSchema = z.enum(["pending", "counted", "discarded"]);

export const intakeSchema = z.object({
  id: idSchema,
  kind: intakeKindSchema,
  status: intakeStatusSchema,
  volume_ml: volumeMlSchema,
  occurred_at: isoDateTimeSchema,
  bottle_id: idSchema.nullable(),
  source_event_id: idSchema.nullable(),
});

export const createIntakeRequestSchema = z.object({
  volume_ml: volumeMlSchema,
  occurred_at: isoDateTimeSchema.optional(),
});

export const updateIntakeRequestSchema = z
  .strictObject({
    volume_ml: volumeMlSchema,
    occurred_at: isoDateTimeSchema,
    status: intakeStatusSchema.exclude(["pending"]),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: "nothing to update" });

export type IntakeKind = z.infer<typeof intakeKindSchema>;
export type IntakeStatus = z.infer<typeof intakeStatusSchema>;
export type Intake = z.infer<typeof intakeSchema>;
export type CreateIntakeRequest = z.infer<typeof createIntakeRequestSchema>;
export type UpdateIntakeRequest = z.infer<typeof updateIntakeRequestSchema>;

import { z } from "zod";
import { isoDateSchema } from "./primitives";

const dailyMlSchema = z.int().min(250).max(10000);

export const goalSchema = z.object({
  daily_ml: dailyMlSchema,
  effective_from: isoDateSchema,
});

export const putGoalRequestSchema = z.strictObject({
  daily_ml: dailyMlSchema,
});

export type Goal = z.infer<typeof goalSchema>;
export type PutGoalRequest = z.infer<typeof putGoalRequestSchema>;

import { z } from "zod";
import { isoDateTimeSchema } from "./primitives";

export const deviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  firmware: z.string().nullable(),
  online: z.boolean(),
  last_seen_at: isoDateTimeSchema.nullable(),
  weight_g: z.number().nullable(),
  rssi_dbm: z.int().nullable(),
  calibrated: z.boolean().nullable(),
});

export type Device = z.infer<typeof deviceSchema>;

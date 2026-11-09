import { z } from "zod";
import { deviceSchema } from "./device";
import { intakeSchema } from "./intake";
import { todaySummarySchema } from "./summary";

export const streamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("summary"), data: todaySummarySchema }),
  z.object({ type: z.literal("device"), data: deviceSchema }),
  z.object({ type: z.literal("intake"), data: intakeSchema }),
]);

export type StreamEvent = z.infer<typeof streamEventSchema>;
export type StreamEventType = StreamEvent["type"];

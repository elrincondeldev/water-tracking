import { MIN_CHANGE_G, SIP_MAX_G } from "./thresholds";

export type WeightChange = {
  kind: "sip" | "refill" | "unclassified";
  volume_ml: number;
};

export function classifyWeightChange(baseline_g: number, weight_g: number): WeightChange | null {
  const delta_g = weight_g - baseline_g;
  const volume_ml = Math.round(Math.abs(delta_g));
  if (Math.abs(delta_g) < MIN_CHANGE_G) return null;
  if (delta_g > 0) return { kind: "refill", volume_ml };
  if (-delta_g <= SIP_MAX_G) return { kind: "sip", volume_ml };
  return { kind: "unclassified", volume_ml };
}

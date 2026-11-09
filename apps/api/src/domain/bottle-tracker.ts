import type { NodeEvent } from "@gota/contracts";
import { classifyWeightChange, type WeightChange } from "./classify-weight-change";

export type BottleState = {
  baseline_g: number | null;
  present: boolean;
  last_weight_g: number | null;
};

export const initialBottleState: BottleState = {
  baseline_g: null,
  present: false,
  last_weight_g: null,
};

export function applyNodeEvent(
  state: BottleState,
  event: NodeEvent,
): { state: BottleState; change: WeightChange | null } {
  switch (event.type) {
    case "placed":
    case "changed":
      return applyStableWeight(state, event.weight_g);
    case "removed":
      return { state: { ...state, present: false }, change: null };
    case "status":
      return { state, change: null };
  }
}

export function resetBottle(state: BottleState): BottleState {
  return { ...state, baseline_g: state.present ? state.last_weight_g : null };
}

function applyStableWeight(state: BottleState, weight_g: number) {
  const next = { ...state, present: true, last_weight_g: weight_g };
  if (state.baseline_g === null) return { state: { ...next, baseline_g: weight_g }, change: null };
  const change = classifyWeightChange(state.baseline_g, weight_g);
  return { state: change ? { ...next, baseline_g: weight_g } : next, change };
}

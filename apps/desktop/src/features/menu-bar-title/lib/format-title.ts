import type { TodaySummary } from "@gota/contracts";

const liters = (volume_ml: number) => Number((volume_ml / 1000).toFixed(1)).toString();

export function formatMenuBarTitle(summary: TodaySummary | undefined): string {
  if (!summary) return "";
  return `${liters(summary.total_ml)} / ${liters(summary.goal_ml)} L`;
}

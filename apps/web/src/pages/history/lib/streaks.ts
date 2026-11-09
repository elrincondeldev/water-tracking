import type { HistoryBucket } from "@gota/contracts";

function met(bucket: HistoryBucket): boolean {
  return bucket.goal_ml > 0 && bucket.total_ml >= bucket.goal_ml;
}

export function computeStreaks(days: HistoryBucket[], today: string) {
  let best = 0;
  let run = 0;
  for (const day of days) {
    run = met(day) ? run + 1 : 0;
    best = Math.max(best, run);
  }

  const last = days.at(-1);
  const todayStillOpen = last !== undefined && last.start === today && !met(last);
  let current = 0;
  for (const day of (todayStillOpen ? days.slice(0, -1) : days).toReversed()) {
    if (!met(day)) break;
    current++;
  }

  return { current, best };
}

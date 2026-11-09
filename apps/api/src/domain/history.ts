import type { Goal, HistoryBucket, HistoryGranularity, Intake } from "@gota/contracts";

const DAY_MS = 86_400_000;

export function localDate(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instant));
}

export function countsTowardTotal(intake: Pick<Intake, "kind" | "status">): boolean {
  return intake.status === "counted" && intake.kind !== "refill";
}

export function goalInEffect(date: string, goals: Goal[]): Goal | undefined {
  const sorted = goals.toSorted((a, b) => a.effective_from.localeCompare(b.effective_from));
  return sorted.findLast((goal) => goal.effective_from <= date) ?? sorted[0];
}

export function goalOn(date: string, goals: Goal[]): number {
  return goalInEffect(date, goals)?.daily_ml ?? 0;
}

export function buildHistoryBuckets(input: {
  from: string;
  to: string;
  granularity: HistoryGranularity;
  timezone: string;
  intakes: Intake[];
  goals: Goal[];
}): HistoryBucket[] {
  const totalsByDay = new Map<string, number>();
  for (const intake of input.intakes.filter(countsTowardTotal)) {
    const day = localDate(intake.occurred_at, input.timezone);
    totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + intake.volume_ml);
  }

  const buckets = new Map<string, HistoryBucket>();
  for (let day = input.from; day <= input.to; day = addDays(day, 1)) {
    const start = bucketStart(day, input.granularity);
    const bucket = buckets.get(start) ?? { start, total_ml: 0, goal_ml: 0 };
    bucket.total_ml += totalsByDay.get(day) ?? 0;
    bucket.goal_ml += goalOn(day, input.goals);
    buckets.set(start, bucket);
  }
  return [...buckets.values()];
}

function bucketStart(day: string, granularity: HistoryGranularity): string {
  if (granularity === "month") return `${day.slice(0, 7)}-01`;
  if (granularity === "week") return addDays(day, -((toDate(day).getUTCDay() + 6) % 7));
  return day;
}

function addDays(day: string, days: number): string {
  return new Date(toDate(day).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

function toDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

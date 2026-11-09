import type { HistoryGranularity } from "@gota/contracts";
import { addDays, addMonths, startOfMonth, startOfWeek } from "@/shared/lib";

export type HistoryView = "days" | "weeks" | "months";

export type Period = { from: string; to: string; granularity: HistoryGranularity };

const DAYS_SHOWN = 7;
const WEEKS_SHOWN = 8;
const MONTHS_SHOWN = 6;

function clipToToday(period: Period, today: string): Period {
  return { ...period, to: period.to < today ? period.to : today };
}

export function periodFor(view: HistoryView, offset: number, today: string): Period {
  if (view === "days") {
    const to = addDays(today, DAYS_SHOWN * offset);
    return { from: addDays(to, -(DAYS_SHOWN - 1)), to, granularity: "day" };
  }
  if (view === "weeks") {
    const from = addDays(startOfWeek(today), 7 * (WEEKS_SHOWN * offset - (WEEKS_SHOWN - 1)));
    const to = addDays(from, 7 * WEEKS_SHOWN - 1);
    return clipToToday({ from, to, granularity: "week" }, today);
  }
  const from = addMonths(startOfMonth(today), MONTHS_SHOWN * offset - (MONTHS_SHOWN - 1));
  const to = addDays(addMonths(from, MONTHS_SHOWN), -1);
  return clipToToday({ from, to, granularity: "month" }, today);
}

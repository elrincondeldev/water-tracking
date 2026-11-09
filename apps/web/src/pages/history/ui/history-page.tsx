import type { HistoryBucket } from "@gota/contracts";
import { Button, Card, SegmentedControl } from "@gota/ui";
import { useState } from "react";
import { IntakeRow, useHistory } from "@/entities/intake";
import { useTodaySummary } from "@/entities/summary";
import { addDays, daysBetween, formatDay, formatMl, todayIn } from "@/shared/lib";
import { type HistoryView, periodFor } from "../lib/period";
import { computeStreaks } from "../lib/streaks";
import { HistoryChart } from "./history-chart";

const VIEWS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
] satisfies { value: HistoryView; label: string }[];

const SHORT: Record<HistoryView, Intl.DateTimeFormatOptions> = {
  days: { weekday: "narrow" },
  weeks: { day: "numeric", month: "numeric" },
  months: { month: "short" },
};

const LONG: Record<HistoryView, Intl.DateTimeFormatOptions> = {
  days: { weekday: "long", day: "numeric", month: "long" },
  weeks: { day: "numeric", month: "long" },
  months: { month: "long", year: "numeric" },
};

function longLabel(view: HistoryView, bucket: HistoryBucket): string {
  const label = formatDay(bucket.start, LONG[view]);
  return view === "weeks" ? `Week of ${label}` : label;
}

export function HistoryPage() {
  const summary = useTodaySummary();
  const timezone = summary.data?.timezone ?? "UTC";
  const today = summary.data?.date ?? todayIn(timezone);
  const [view, setView] = useState<HistoryView>("days");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string>();

  const period = periodFor(view, offset, today);
  const history = useHistory(period.from, period.to, period.granularity, view === "days");
  const year = useHistory(addDays(today, -364), today, "day", false);
  const streaks = computeStreaks(year.data?.buckets ?? [], today);

  const buckets = history.data?.buckets ?? [];
  const current = buckets.find((b) => b.start === selected) ?? buckets.at(-1);
  const total = buckets.reduce((sum, b) => sum + b.total_ml, 0);
  const average = Math.round(total / daysBetween(period.from, period.to));
  const dayIntakes =
    view === "days" && current
      ? (history.data?.intakes ?? []).filter(
          (i) => todayIn(timezone, new Date(i.occurred_at)) === current.start,
        )
      : [];

  const changeView = (next: HistoryView) => {
    setView(next);
    setOffset(0);
    setSelected(undefined);
  };
  const page = (delta: number) => {
    setOffset(offset + delta);
    setSelected(undefined);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">History</h1>
        <SegmentedControl label="Group by" options={VIEWS} value={view} onChange={changeView} />
      </div>

      <dl className="grid grid-cols-3 gap-3 text-center">
        {[
          ["Current streak", `${streaks.current} d`],
          ["Best streak", `${streaks.best} d`],
          ["Daily average", formatMl(average)],
        ].map(([term, value]) => (
          <div key={term} className="rounded-2xl bg-sunken px-3 py-3">
            <dt className="text-xs text-muted">{term}</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <Card>
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" aria-label="Earlier" onClick={() => page(-1)}>
            ‹
          </Button>
          <p className="text-sm text-muted">
            {formatDay(period.from, { day: "numeric", month: "short" })} –{" "}
            {formatDay(period.to, { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <Button
            variant="ghost"
            aria-label="Later"
            disabled={offset === 0}
            onClick={() => page(1)}
          >
            ›
          </Button>
        </div>
        {history.isError ? (
          <p className="py-16 text-center text-sm text-muted">Can't load history.</p>
        ) : (
          <HistoryChart
            buckets={buckets}
            selected={current?.start}
            onSelect={setSelected}
            shortLabel={(b) => formatDay(b.start, SHORT[view])}
            longLabel={(b) => longLabel(view, b)}
          />
        )}
      </Card>

      {current && (
        <Card>
          <div className="flex items-baseline justify-between">
            <h2 className="font-medium">{longLabel(view, current)}</h2>
            <p className="text-sm text-muted tabular-nums">
              {formatMl(current.total_ml)} of {formatMl(current.goal_ml)}
            </p>
          </div>
          {view === "days" &&
            (dayIntakes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No drinks this day.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {dayIntakes.toReversed().map((intake) => (
                  <IntakeRow key={intake.id} intake={intake} timezone={timezone} />
                ))}
              </ul>
            ))}
        </Card>
      )}
    </div>
  );
}

import type { TodaySummary } from "@gota/contracts";
import { cx, formatAgo, formatMl, WaterDrop } from "@gota/ui";
import type { ReactNode } from "react";

type TodayOverviewProps = {
  summary: TodaySummary;
  now: Date;
  dimmed: boolean;
};

function splitVolume(volume_ml: number) {
  const [value = "", unit = ""] = formatMl(volume_ml).split(" ");
  return { value, unit };
}

export function TodayOverview({ summary, now, dimmed }: TodayOverviewProps) {
  const percent = Math.round(summary.progress * 100);
  const total = splitVolume(summary.total_ml);
  const remaining_ml = Math.max(summary.goal_ml - summary.total_ml, 0);

  return (
    <div className={cx("flex flex-col gap-4 transition-opacity", dimmed && "opacity-55")}>
      <section className="flex items-center gap-5 px-1">
        <div className="h-24 w-20 shrink-0" role="img" aria-label={`${percent}% of today's goal`}>
          <WaterDrop progress={summary.progress} />
        </div>
        <div className="min-w-0">
          <p className="flex items-baseline gap-1 tabular-nums">
            <span className="text-[34px] leading-none font-semibold tracking-tight">
              {total.value}
            </span>
            <span className="text-base font-medium text-muted">{total.unit}</span>
          </p>
          <p className="mt-1.5 text-muted">
            of {formatMl(summary.goal_ml)} ·{" "}
            <span className="font-medium text-accent-strong tabular-nums">{percent}%</span>
          </p>
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-2">
        <Stat label="Last drink">
          {summary.last_intake_at ? formatAgo(summary.last_intake_at, now) : "None yet"}
        </Stat>
        <Stat label="To go">
          {remaining_ml > 0 ? (
            formatMl(remaining_ml)
          ) : (
            <span className="text-accent-strong">Goal met</span>
          )}
        </Stat>
      </dl>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-pane-line bg-pane px-3 py-2.5">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{children}</dd>
    </div>
  );
}

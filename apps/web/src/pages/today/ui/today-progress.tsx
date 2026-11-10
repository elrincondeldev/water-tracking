import type { TodaySummary } from "@gota/contracts";
import { WaterDrop } from "@gota/ui";
import { formatMl } from "@/shared/lib";

export function TodayProgress({ summary }: { summary: TodaySummary }) {
  const percent = Math.round(summary.progress * 100);
  return (
    <figure className="flex flex-col items-center gap-6">
      <div
        className="relative h-72 w-60"
        role="img"
        aria-label={`${formatMl(summary.total_ml)} of ${formatMl(summary.goal_ml)}, ${percent}% of today's goal`}
      >
        <WaterDrop progress={summary.progress} />
      </div>
      <figcaption className="text-center">
        <p className="text-4xl font-semibold tracking-tight tabular-nums">
          {formatMl(summary.total_ml)}
        </p>
        <p className="mt-1 text-sm text-muted">
          of {formatMl(summary.goal_ml)} · {percent}%
        </p>
      </figcaption>
    </figure>
  );
}

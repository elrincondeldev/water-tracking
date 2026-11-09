import type { HistoryBucket } from "@gota/contracts";
import { cx } from "@gota/ui";
import { formatMl } from "@/shared/lib";

export function HistoryChart({
  buckets,
  selected,
  onSelect,
  shortLabel,
  longLabel,
}: {
  buckets: HistoryBucket[];
  selected: string | undefined;
  onSelect: (start: string) => void;
  shortLabel: (bucket: HistoryBucket) => string;
  longLabel: (bucket: HistoryBucket) => string;
}) {
  const scale = Math.max(1, ...buckets.flatMap((b) => [b.total_ml, b.goal_ml])) * 1.1;
  const height = (ml: number) => `${(ml / scale) * 100}%`;

  return (
    <figure>
      <div className="flex h-48 items-end gap-0.5">
        {buckets.map((bucket) => {
          const isSelected = bucket.start === selected;
          return (
            <button
              key={bucket.start}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${longLabel(bucket)}: ${formatMl(bucket.total_ml)} of ${formatMl(bucket.goal_ml)}`}
              onClick={() => onSelect(bucket.start)}
              className="group relative flex h-full flex-1 items-end justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-accent"
            >
              {bucket.goal_ml > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 border-t border-dashed border-muted/60"
                  style={{ bottom: height(bucket.goal_ml) }}
                />
              )}
              <span
                aria-hidden
                className={cx(
                  "w-full max-w-6 rounded-t-[4px] bg-chart transition-[height]",
                  bucket.total_ml === 0 && "h-0",
                )}
                style={{ height: height(bucket.total_ml) }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -top-7 z-10 rounded-md bg-text px-2 py-1 text-xs whitespace-nowrap text-surface opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {formatMl(bucket.total_ml)}
              </span>
            </button>
          );
        })}
      </div>
      <div aria-hidden className="mt-2 flex gap-0.5">
        {buckets.map((bucket) => (
          <span
            key={bucket.start}
            className={cx(
              "flex-1 text-center text-xs",
              bucket.start === selected ? "font-medium text-text" : "text-muted",
            )}
          >
            {shortLabel(bucket)}
          </span>
        ))}
      </div>
      <figcaption className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span aria-hidden className="w-4 border-t border-dashed border-muted" />
        Goal
      </figcaption>
      <table className="sr-only">
        <caption>Water drunk per period</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Drunk</th>
            <th scope="col">Goal</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.start}>
              <th scope="row">{longLabel(bucket)}</th>
              <td>{formatMl(bucket.total_ml)}</td>
              <td>{formatMl(bucket.goal_ml)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

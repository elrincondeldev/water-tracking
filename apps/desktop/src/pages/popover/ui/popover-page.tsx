import { cx, formatAgo, formatMl, formatTime, WaterDrop } from "@gota/ui";
import { useDevice } from "@/entities/device";
import { useTodayIntakes } from "@/entities/intake";
import { useTodaySummary } from "@/entities/summary";
import { useNow } from "@/shared/lib";

const RECENT_SIPS = 4;

export function PopoverPage({ live }: { live: boolean }) {
  const summary = useTodaySummary();
  const device = useDevice();
  const intakes = useTodayIntakes(summary.data?.date);
  const now = useNow();

  if (!summary.data) {
    return (
      <main className="grid h-dvh place-items-center p-6 text-center text-sm text-muted">
        {summary.isError ? "Can't reach the Gota API." : "Loading…"}
      </main>
    );
  }

  const { data } = summary;
  const percent = Math.round(data.progress * 100);
  const recent = (intakes.data ?? [])
    .filter((i) => i.kind !== "refill" && i.status === "counted")
    .toReversed()
    .slice(0, RECENT_SIPS);
  const online = device.data?.online ?? false;

  return (
    <main className="flex h-dvh flex-col gap-5 p-5">
      <header className="flex items-center justify-between text-xs text-muted">
        <span className="text-sm font-semibold text-text">Gota</span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cx("size-2 rounded-full", online ? "bg-accent" : "bg-muted/50")}
          />
          {!live ? "Reconnecting…" : online ? "Coaster online" : "Coaster offline"}
        </span>
      </header>

      <section className="flex items-center gap-5">
        <div className="h-28 w-24 shrink-0" role="img" aria-label={`${percent}% of today's goal`}>
          <WaterDrop progress={data.progress} />
        </div>
        <div>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {formatMl(data.total_ml)}
          </p>
          <p className="text-sm text-muted">
            of {formatMl(data.goal_ml)} · {percent}%
          </p>
          <p className="mt-2 text-xs text-muted">
            {data.last_intake_at
              ? `Last drink ${formatAgo(data.last_intake_at, now)}`
              : "No drinks yet"}
          </p>
        </div>
      </section>

      <section className="flex-1">
        <h2 className="text-xs font-medium text-muted">Recent</h2>
        {recent.length === 0 ? (
          <p className="py-4 text-sm text-muted">Nothing yet today.</p>
        ) : (
          <ul className="mt-1 divide-y divide-line">
            {recent.map((intake) => (
              <li key={intake.id} className="flex justify-between py-2 text-sm">
                <time className="text-muted tabular-nums" dateTime={intake.occurred_at}>
                  {formatTime(intake.occurred_at, data.timezone)}
                </time>
                <span className="font-medium tabular-nums">{formatMl(intake.volume_ml)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

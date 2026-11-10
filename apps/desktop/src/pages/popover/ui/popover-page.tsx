import { Button, cx, formatAgo, formatMl, formatTime, WaterDrop } from "@gota/ui";
import { useState } from "react";
import { useDevice } from "@/entities/device";
import { useTodayIntakes } from "@/entities/intake";
import { useTodaySummary } from "@/entities/summary";
import { AppSettings } from "@/features/configure-app";
import { SnoozeReminders } from "@/features/snooze-reminders";
import { useNow } from "@/shared/lib";

const RECENT_SIPS = 4;

export function PopoverPage({ live }: { live: boolean }) {
  const summary = useTodaySummary();
  const device = useDevice();
  const intakes = useTodayIntakes(summary.data?.date);
  const now = useNow();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (settingsOpen) {
    return (
      <main className="flex h-dvh flex-col gap-5 p-5">
        <h1 className="text-sm font-semibold">Settings</h1>
        <AppSettings onDone={() => setSettingsOpen(false)} />
      </main>
    );
  }

  if (!summary.data) {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center text-sm text-muted">
        {summary.isError ? "Can't reach the Gota API." : "Loading…"}
        {summary.isError && (
          <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
            Check the address
          </Button>
        )}
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
  const stale = !live && summary.isError;
  const updatedAt = new Date(summary.dataUpdatedAt).toISOString();

  return (
    <main className="flex h-dvh flex-col gap-5 p-5">
      <header className="flex items-center justify-between text-xs text-muted">
        <span className="text-sm font-semibold text-text">Gota</span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cx("size-2 rounded-full", online && !stale ? "bg-accent" : "bg-muted/50")}
          />
          {stale
            ? `Offline · updated ${formatTime(updatedAt, data.timezone)}`
            : !live
              ? "Reconnecting…"
              : online
                ? "Coaster online"
                : "Coaster offline"}
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
            className="ml-1 rounded-full px-1.5 text-base leading-none hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
          >
            ⚙︎
          </button>
        </span>
      </header>

      <section className={cx("flex items-center gap-5", stale && "opacity-60")}>
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

      <footer className="border-t border-line pt-3">
        <SnoozeReminders timezone={data.timezone} now={now} />
      </footer>
    </main>
  );
}

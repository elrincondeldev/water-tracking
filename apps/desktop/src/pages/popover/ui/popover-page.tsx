import { Button, formatTime } from "@gota/ui";
import { useState } from "react";
import { useDevice } from "@/entities/device";
import { useTodayIntakes } from "@/entities/intake";
import { useTodaySummary } from "@/entities/summary";
import { AppSettings } from "@/features/configure-app";
import { SnoozeReminders } from "@/features/snooze-reminders";
import { useNow } from "@/shared/lib";
import { ChevronLeftIcon, DropIcon, IconButton, SettingsIcon } from "@/shared/ui";
import { ConnectionStatus } from "./connection-status";
import { RecentIntakes } from "./recent-intakes";
import { TodayOverview } from "./today-overview";

const RECENT_SIPS = 4;

function formatDay(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function PopoverPage({ live }: { live: boolean }) {
  const summary = useTodaySummary();
  const device = useDevice();
  const intakes = useTodayIntakes(summary.data?.date);
  const now = useNow();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (settingsOpen) {
    return (
      <main className="flex h-dvh flex-col gap-4 p-4">
        <header className="-ml-1.5 flex items-center gap-1">
          <IconButton aria-label="Back" onClick={() => setSettingsOpen(false)}>
            <ChevronLeftIcon className="size-4" />
          </IconButton>
          <h1 className="font-semibold">Settings</h1>
        </header>
        <AppSettings onDone={() => setSettingsOpen(false)} />
      </main>
    );
  }

  if (!summary.data) {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
        <DropIcon className="size-8 text-muted/60" strokeWidth={1.1} />
        {summary.isError ? (
          <>
            <div>
              <p className="font-semibold">Can't reach Gota</p>
              <p className="mt-1 text-muted">
                Check that the API is running and the address is right.
              </p>
            </div>
            <Button
              variant="secondary"
              className="h-8 rounded-lg px-3 text-[13px]"
              onClick={() => setSettingsOpen(true)}
            >
              Check the address
            </Button>
          </>
        ) : (
          <p className="text-muted">Loading…</p>
        )}
      </main>
    );
  }

  const { data } = summary;
  const recent = (intakes.data ?? [])
    .filter((i) => i.kind !== "refill" && i.status === "counted")
    .toReversed()
    .slice(0, RECENT_SIPS);
  const online = device.data?.online ?? false;
  const stale = !live && summary.isError;
  const status = stale
    ? `Offline · ${formatTime(new Date(summary.dataUpdatedAt).toISOString(), data.timezone)}`
    : !live
      ? "Reconnecting…"
      : online
        ? "Coaster online"
        : "Coaster offline";

  return (
    <main className="flex h-dvh flex-col gap-5 p-4">
      <header className="flex items-start justify-between">
        <div className="px-1">
          <h1 className="font-semibold">Today</h1>
          <p className="text-xs text-muted">{formatDay(data.date)}</p>
        </div>
        <div className="-mr-1.5 flex items-center gap-1">
          <ConnectionStatus label={status} healthy={online && live} />
          <IconButton aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon className="size-4" />
          </IconButton>
        </div>
      </header>

      <TodayOverview summary={data} now={now} dimmed={stale} />
      <RecentIntakes intakes={recent} timezone={data.timezone} />

      <footer className="-mx-4 -mb-4 border-t border-pane-line px-4 py-2.5">
        <SnoozeReminders timezone={data.timezone} now={now} />
      </footer>
    </main>
  );
}

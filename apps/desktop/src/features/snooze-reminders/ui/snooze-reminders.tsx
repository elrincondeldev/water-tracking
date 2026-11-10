import { formatTime } from "@gota/ui";
import { reminderState, useReminderState } from "@/entities/reminder";
import { BellIcon, BellOffIcon } from "@/shared/ui";

const SNOOZE_MS = 60 * 60_000;

export function SnoozeReminders({ timezone, now }: { timezone: string; now: Date }) {
  const { snoozedUntil } = useReminderState();
  const snoozed = snoozedUntil !== null && snoozedUntil > now.getTime();
  const Icon = snoozed ? BellOffIcon : BellIcon;
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted">
      <span className="flex items-center gap-2">
        <Icon className="size-3.5" />
        {snoozed
          ? `Paused until ${formatTime(new Date(snoozedUntil).toISOString(), timezone)}`
          : "Reminders on"}
      </span>
      <button
        type="button"
        className="h-7 rounded-md px-2.5 font-medium text-text transition-colors hover:bg-pane-line focus-visible:outline-2 focus-visible:outline-accent"
        onClick={() => reminderState.snoozeUntil(snoozed ? null : now.getTime() + SNOOZE_MS)}
      >
        {snoozed ? "Resume" : "Pause 1 h"}
      </button>
    </div>
  );
}

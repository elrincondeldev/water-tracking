import { Button, formatTime } from "@gota/ui";
import { reminderState, useReminderState } from "@/entities/reminder";

const SNOOZE_MS = 60 * 60_000;

export function SnoozeReminders({ timezone, now }: { timezone: string; now: Date }) {
  const { snoozedUntil } = useReminderState();
  const snoozed = snoozedUntil !== null && snoozedUntil > now.getTime();
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted">
      <span>
        {snoozed
          ? `Reminders paused until ${formatTime(new Date(snoozedUntil).toISOString(), timezone)}`
          : "Reminders on"}
      </span>
      <Button
        variant="ghost"
        className="h-8 px-3 text-xs"
        onClick={() => reminderState.snoozeUntil(snoozed ? null : now.getTime() + SNOOZE_MS)}
      >
        {snoozed ? "Resume" : "Pause 1 h"}
      </Button>
    </div>
  );
}

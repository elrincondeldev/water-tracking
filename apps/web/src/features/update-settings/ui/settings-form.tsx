import type { Settings } from "@gota/contracts";
import { Button } from "@gota/ui";
import { type FormEvent, useState } from "react";
import { apiClient, useApiMutation } from "@/shared/api";
import { TextField } from "@/shared/ui";

const TIMEZONES = Intl.supportedValuesOf("timeZone");

export function SettingsForm({ settings }: { settings: Settings }) {
  const [draft, setDraft] = useState(settings);
  const save = useApiMutation(apiClient.putSettings);
  const reminders = (patch: Partial<Settings["reminders"]>) =>
    setDraft({ ...draft, reminders: { ...draft.reminders, ...patch } });
  const quiet = (patch: Partial<Settings["quiet_hours"]>) =>
    setDraft({ ...draft, quiet_hours: { ...draft.quiet_hours, ...patch } });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate(draft);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Timezone (days start at midnight here)</span>
        <select
          value={draft.timezone}
          onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
          className="h-10 rounded-xl border border-line bg-surface px-3 text-text"
        >
          {TIMEZONES.map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium">Reminders on the Mac</legend>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={draft.reminders.enabled}
            onChange={(e) => reminders({ enabled: e.target.checked })}
            className="size-4 accent-accent"
          />
          Remind me to drink
        </label>
        <TextField
          label="After this many minutes without a drink"
          type="number"
          inputMode="numeric"
          min={15}
          max={480}
          required
          disabled={!draft.reminders.enabled}
          value={draft.reminders.idle_min}
          onChange={(e) => reminders({ idle_min: Number(e.target.value) })}
        />
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={draft.reminders.pace_enabled}
            disabled={!draft.reminders.enabled}
            onChange={(e) => reminders({ pace_enabled: e.target.checked })}
            className="size-4 accent-accent"
          />
          Also when I fall behind the day's pace
        </label>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Quiet hours</legend>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="From"
            type="time"
            required
            value={draft.quiet_hours.start}
            onChange={(e) => quiet({ start: e.target.value })}
          />
          <TextField
            label="Until"
            type="time"
            required
            value={draft.quiet_hours.end}
            onChange={(e) => quiet({ end: e.target.value })}
          />
        </div>
      </fieldset>

      {save.isError && <p className="text-sm text-danger">{save.error.message}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={save.isPending}>
          Save settings
        </Button>
        {save.isSuccess && <span className="text-sm text-muted">Saved.</span>}
      </div>
    </form>
  );
}

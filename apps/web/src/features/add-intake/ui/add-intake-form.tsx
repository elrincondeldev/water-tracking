import { Button, cx } from "@gota/ui";
import { type FormEvent, useState } from "react";
import { apiClient, useApiMutation } from "@/shared/api";
import { formatMl } from "@/shared/lib";
import { TextField } from "@/shared/ui";

const PRESETS_ML = [150, 250, 330, 500];

function todayAt(time: string): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function AddIntakeForm() {
  const [volume, setVolume] = useState("250");
  const [time, setTime] = useState("");
  const add = useApiMutation(apiClient.createIntake);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    add.mutate(
      { volume_ml: Number(volume), ...(time ? { occurred_at: todayAt(time) } : {}) },
      { onSuccess: () => setTime("") },
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS_ML.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={volume === String(preset)}
            onClick={() => setVolume(String(preset))}
            className={cx(
              "rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-accent",
              volume === String(preset)
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-line text-muted hover:text-text",
            )}
          >
            {formatMl(preset)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Amount in ml"
          type="number"
          inputMode="numeric"
          required
          min={1}
          max={5000}
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
        />
        <TextField
          label="Time today (empty = now)"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      {add.isError && <p className="text-sm text-danger">{add.error.message}</p>}
      <Button type="submit" className="self-start" disabled={add.isPending}>
        Add {volume ? formatMl(Number(volume)) : ""}
      </Button>
    </form>
  );
}

import type { Intake } from "@gota/contracts";
import { Button } from "@gota/ui";
import { type FormEvent, useState } from "react";
import { apiClient, useApiMutation } from "@/shared/api";

export function EditIntakeActions({ intake }: { intake: Intake }) {
  const [editing, setEditing] = useState(false);
  const [volume, setVolume] = useState(String(intake.volume_ml));
  const update = useApiMutation((body: Parameters<typeof apiClient.updateIntake>[1]) =>
    apiClient.updateIntake(intake.id, body),
  );
  const remove = useApiMutation(() => apiClient.deleteIntake(intake.id));
  const busy = update.isPending || remove.isPending;

  if (intake.status === "discarded") {
    return (
      <Button variant="ghost" disabled={busy} onClick={() => update.mutate({ status: "counted" })}>
        Restore
      </Button>
    );
  }

  if (editing) {
    const save = (event: FormEvent) => {
      event.preventDefault();
      update.mutate({ volume_ml: Number(volume) }, { onSuccess: () => setEditing(false) });
    };
    return (
      <form onSubmit={save} className="flex items-center gap-1">
        <input
          aria-label="Amount in ml"
          type="number"
          inputMode="numeric"
          min={1}
          max={5000}
          required
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="h-9 w-20 rounded-lg border border-line bg-surface px-2 text-sm tabular-nums"
        />
        <Button type="submit" variant="secondary" disabled={busy}>
          Save
        </Button>
      </form>
    );
  }

  return (
    <span className="flex">
      <Button variant="ghost" disabled={busy} onClick={() => setEditing(true)}>
        Edit
      </Button>
      <Button variant="ghost" disabled={busy} onClick={() => remove.mutate()}>
        Delete
      </Button>
    </span>
  );
}

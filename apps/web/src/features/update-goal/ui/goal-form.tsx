import { Button } from "@gota/ui";
import { type FormEvent, useState } from "react";
import { apiClient, useApiMutation } from "@/shared/api";
import { TextField } from "@/shared/ui";

export function GoalForm({ dailyMl }: { dailyMl: number }) {
  const [value, setValue] = useState(String(dailyMl));
  const save = useApiMutation(apiClient.putGoal);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({ daily_ml: Number(value) });
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <TextField
          label="Daily goal in ml"
          type="number"
          inputMode="numeric"
          required
          min={250}
          max={10000}
          step={50}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={save.isPending}>
          Save
        </Button>
      </div>
      <p className="text-sm text-muted">
        {save.isSuccess
          ? "Saved. It applies from today; past days keep their goal."
          : "Changes apply from today; past days keep their goal."}
      </p>
      {save.isError && <p className="text-sm text-danger">{save.error.message}</p>}
    </form>
  );
}

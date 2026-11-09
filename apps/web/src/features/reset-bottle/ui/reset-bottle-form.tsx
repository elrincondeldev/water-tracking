import { Button } from "@gota/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { apiClient } from "@/shared/api";
import { TextField } from "@/shared/ui";

export function ResetBottleForm() {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const reset = useMutation({
    mutationFn: apiClient.resetBottle,
    onSuccess: () => {
      setConfirming(false);
      setName("");
      setCapacity("");
      return queryClient.invalidateQueries();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!confirming) return setConfirming(true);
    reset.mutate({
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(capacity ? { capacity_ml: Number(capacity) } : {}),
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Start counting again after switching bottles. If a bottle is on the coaster, its weight
        becomes the new starting point; otherwise counting starts when you put one down.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Name (optional)"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Capacity in ml (optional)"
          type="number"
          inputMode="numeric"
          min={50}
          max={5000}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
      </div>
      {reset.isError && <p className="text-sm text-danger">{reset.error.message}</p>}
      <div className="flex gap-2">
        <Button
          type="submit"
          variant={confirming ? "danger" : "primary"}
          disabled={reset.isPending}
        >
          {confirming ? "Yes, start a new bottle" : "Start a new bottle"}
        </Button>
        {confirming && (
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

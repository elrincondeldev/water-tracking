import type { Intake } from "@gota/contracts";
import { Button } from "@gota/ui";
import { apiClient, useApiMutation } from "@/shared/api";

export function ReviewDropActions({ intake }: { intake: Intake }) {
  const review = useApiMutation((status: "counted" | "discarded") =>
    apiClient.updateIntake(intake.id, { status }),
  );
  return (
    <span className="flex gap-1">
      <Button
        variant="secondary"
        disabled={review.isPending}
        onClick={() => review.mutate("counted")}
      >
        I drank it
      </Button>
      <Button
        variant="ghost"
        disabled={review.isPending}
        onClick={() => review.mutate("discarded")}
      >
        Discard
      </Button>
    </span>
  );
}

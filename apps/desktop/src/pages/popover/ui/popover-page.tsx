import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

export function PopoverPage() {
  const summary = useQuery({ queryKey: ["summary", "today"], queryFn: apiClient.getTodaySummary });
  return (
    <main className="p-5">
      <h1 className="text-lg font-semibold">Gota</h1>
      <p className="mt-2 text-sm text-muted">
        {summary.data
          ? `${summary.data.total_ml} of ${summary.data.goal_ml} ml today`
          : summary.isError
            ? "Can't reach the Gota API."
            : "Loading…"}
      </p>
    </main>
  );
}

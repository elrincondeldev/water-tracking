import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

export const intakesKey = ["intakes"] as const;

export function useTodayIntakes(date: string | undefined) {
  return useQuery({
    queryKey: [...intakesKey, date],
    queryFn: () => apiClient.getHistory({ from: date ?? "", to: date ?? "" }),
    enabled: date !== undefined,
    select: (history) => history.intakes,
  });
}

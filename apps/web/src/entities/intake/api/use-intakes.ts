import type { HistoryGranularity } from "@gota/contracts";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

export const historyKey = ["history"] as const;

export function useHistory(from: string, to: string, granularity: HistoryGranularity = "day") {
  return useQuery({
    queryKey: [...historyKey, from, to, granularity],
    queryFn: () => apiClient.getHistory({ from, to, granularity }),
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

export const todaySummaryKey = ["summary", "today"] as const;

export function useTodaySummary() {
  return useQuery({ queryKey: todaySummaryKey, queryFn: apiClient.getTodaySummary });
}

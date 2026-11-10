import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

export const settingsKey = ["settings"] as const;

export function useSettings() {
  return useQuery({ queryKey: settingsKey, queryFn: apiClient.getSettings });
}

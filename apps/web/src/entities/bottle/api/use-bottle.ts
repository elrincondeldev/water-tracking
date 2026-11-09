import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

export const bottleKey = ["bottle"] as const;

export function useBottle() {
  return useQuery({ queryKey: bottleKey, queryFn: apiClient.getBottle });
}

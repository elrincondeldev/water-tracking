import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

export const deviceKey = ["device"] as const;

export function useDevice() {
  return useQuery({ queryKey: deviceKey, queryFn: apiClient.getDevice });
}

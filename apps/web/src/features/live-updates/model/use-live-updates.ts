import { subscribeToStream } from "@gota/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { deviceKey } from "@/entities/device";
import { todaySummaryKey } from "@/entities/summary";

export function useLiveUpdates(): boolean {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(
    () =>
      subscribeToStream({
        onEvent: (event) => {
          if (event.type === "device") {
            queryClient.setQueryData(deviceKey, event.data);
          } else if (event.type === "summary") {
            queryClient.setQueryData(todaySummaryKey, event.data);
            void queryClient.invalidateQueries({
              predicate: ({ queryKey }) => queryKey[0] !== "summary" && queryKey[0] !== "device",
            });
          }
        },
        onConnectionChange: (isConnected) => {
          setConnected(isConnected);
          if (isConnected) void queryClient.invalidateQueries();
        },
      }),
    [queryClient],
  );

  return connected;
}

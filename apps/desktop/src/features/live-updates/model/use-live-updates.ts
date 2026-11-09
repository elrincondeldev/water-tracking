import { subscribeToStream } from "@gota/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { deviceKey } from "@/entities/device";
import { intakesKey } from "@/entities/intake";
import { todaySummaryKey } from "@/entities/summary";
import { API_URL } from "@/shared/api";

export function useLiveUpdates(): boolean {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(
    () =>
      subscribeToStream(
        {
          onEvent: (event) => {
            if (event.type === "device") queryClient.setQueryData(deviceKey, event.data);
            if (event.type === "summary") {
              queryClient.setQueryData(todaySummaryKey, event.data);
              void queryClient.invalidateQueries({ queryKey: intakesKey });
            }
          },
          onConnectionChange: (isConnected) => {
            setConnected(isConnected);
            if (isConnected) void queryClient.invalidateQueries();
          },
        },
        { baseUrl: API_URL },
      ),
    [queryClient],
  );

  return connected;
}

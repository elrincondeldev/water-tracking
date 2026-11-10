import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";

const KEEP_FOR_MS = 7 * 24 * 60 * 60_000;

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, gcTime: KEEP_FOR_MS } },
});

export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "gota.queries",
});

export const persistOptions = { persister, maxAge: KEEP_FOR_MS };

import { Outlet } from "react-router";
import { useLiveUpdates } from "@/features/live-updates";
import { useOnline } from "@/shared/lib";
import { Navigation } from "@/widgets/navigation";

export function AppLayout() {
  const live = useLiveUpdates();
  const online = useOnline();
  const status = !online ? "Offline · showing saved data" : !live ? "Reconnecting…" : null;
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 pt-6 sm:px-6">
        <span className="flex items-baseline gap-3">
          <span className="text-lg font-semibold tracking-tight">Gota</span>
          {status && (
            <span role="status" className="text-xs text-muted">
              {status}
            </span>
          )}
        </span>
        <Navigation />
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:px-6 sm:pb-12">
        <Outlet />
      </main>
    </div>
  );
}

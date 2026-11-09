import { Outlet } from "react-router";
import { useLiveUpdates } from "@/features/live-updates";
import { Navigation } from "@/widgets/navigation";

export function AppLayout() {
  const live = useLiveUpdates();
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 pt-6 sm:px-6">
        <span className="flex items-baseline gap-3">
          <span className="text-lg font-semibold tracking-tight">Gota</span>
          {!live && <span className="text-xs text-muted">Reconnecting…</span>}
        </span>
        <Navigation />
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:px-6 sm:pb-12">
        <Outlet />
      </main>
    </div>
  );
}

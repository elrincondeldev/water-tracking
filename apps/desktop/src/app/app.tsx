import { useLiveUpdates } from "@/features/live-updates";
import { useMenuBarTitle } from "@/features/menu-bar-title";
import { useReminders } from "@/features/reminders";
import { PopoverPage } from "@/pages/popover";

export function App() {
  const live = useLiveUpdates();
  useMenuBarTitle();
  useReminders();
  return <PopoverPage live={live} />;
}

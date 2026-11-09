import { useLiveUpdates } from "@/features/live-updates";
import { useMenuBarTitle } from "@/features/menu-bar-title";
import { PopoverPage } from "@/pages/popover";

export function App() {
  const live = useLiveUpdates();
  useMenuBarTitle();
  return <PopoverPage live={live} />;
}

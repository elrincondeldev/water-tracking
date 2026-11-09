import { TrayIcon } from "@tauri-apps/api/tray";
import { useEffect } from "react";
import { useTodaySummary } from "@/entities/summary";
import { formatMenuBarTitle } from "../lib/format-title";

const TRAY_ID = "main";

export function useMenuBarTitle() {
  const { data } = useTodaySummary();
  const title = formatMenuBarTitle(data);
  useEffect(() => {
    void TrayIcon.getById(TRAY_ID).then((tray) => tray?.setTitle(title));
  }, [title]);
}

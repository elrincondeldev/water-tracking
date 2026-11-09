import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { useEffect, useRef } from "react";
import { useSettings } from "@/entities/preference";
import { nextReminder, reminderState } from "@/entities/reminder";
import { useTodaySummary } from "@/entities/summary";

const CHECK_EVERY_MS = 60_000;

async function canNotify(): Promise<boolean> {
  if (await isPermissionGranted()) return true;
  return (await requestPermission()) === "granted";
}

export function useReminders() {
  const summary = useTodaySummary();
  const settings = useSettings();
  const latest = useRef({ summary: summary.data, settings: settings.data });
  latest.current = { summary: summary.data, settings: settings.data };

  useEffect(() => {
    const check = async () => {
      const { summary, settings } = latest.current;
      if (!summary || !settings) return;
      const now = new Date();
      const reminder = nextReminder({ now, summary, settings, state: reminderState.get() });
      if (!reminder || !(await canNotify())) return;
      reminderState.markReminded(now.getTime());
      sendNotification({ title: reminder.title, body: reminder.body });
    };
    const timer = setInterval(() => void check(), CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, []);
}

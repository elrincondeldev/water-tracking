import { useSyncExternalStore } from "react";
import type { ReminderState } from "../lib/next-reminder";

const STORAGE_KEY = "gota.reminders";
const listeners = new Set<() => void>();
let cached: ReminderState | null = null;

function read(): ReminderState {
  if (cached) return cached;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as ReminderState | null;
    cached = parsed ?? { lastReminderAt: null, snoozedUntil: null };
  } catch {
    cached = { lastReminderAt: null, snoozedUntil: null };
  }
  return cached;
}

function write(next: ReminderState) {
  cached = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  for (const listener of listeners) listener();
}

export const reminderState = {
  get: read,
  markReminded: (at: number) => write({ ...read(), lastReminderAt: at }),
  snoozeUntil: (until: number | null) => write({ ...read(), snoozedUntil: until }),
};

export function useReminderState(): ReminderState {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, read);
}

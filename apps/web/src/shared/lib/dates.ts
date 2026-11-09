const DAY_MS = 86_400_000;

function toDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, days: number): string {
  return toDay(new Date(toDate(day).getTime() + days * DAY_MS));
}

export function startOfWeek(day: string): string {
  return addDays(day, -((toDate(day).getUTCDay() + 6) % 7));
}

export function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function addMonths(day: string, months: number): string {
  const date = toDate(startOfMonth(day));
  date.setUTCMonth(date.getUTCMonth() + months);
  return toDay(date);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS) + 1;
}

export function formatDay(day: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(toDate(day));
}

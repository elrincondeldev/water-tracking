export function formatMl(volume_ml: number): string {
  if (volume_ml >= 1000) return `${Number((volume_ml / 1000).toFixed(2))} L`;
  return `${Math.round(volume_ml)} ml`;
}

export function formatGrams(weight_g: number): string {
  return `${new Intl.NumberFormat("en").format(Math.round(weight_g))} g`;
}

export function formatTime(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(instant));
}

export function formatAgo(instant: string, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - Date.parse(instant)) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${minutes % 60} min ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export function todayIn(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

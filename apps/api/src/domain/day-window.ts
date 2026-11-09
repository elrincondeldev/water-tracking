const DAY_MS = 86_400_000;

// Wide enough to hold every instant whose local date falls in [from, to] in any timezone.
export function utcWindowCovering(from: string, to: string): { start: Date; end: Date } {
  return {
    start: new Date(Date.parse(`${from}T00:00:00.000Z`) - DAY_MS),
    end: new Date(Date.parse(`${to}T00:00:00.000Z`) + 2 * DAY_MS),
  };
}

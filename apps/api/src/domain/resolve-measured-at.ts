type Timing = { t_ms: number | null; uptime_ms: number };

export function resolveMeasuredAt(events: Timing[], receivedAtMs: number): number[] {
  return splitByBoot(events).flatMap((boot) => {
    const synced = boot.find((event) => event.t_ms !== null);
    const offsetMs = synced?.t_ms != null ? synced.t_ms - synced.uptime_ms : null;
    return boot.map(
      (event) => event.t_ms ?? (offsetMs === null ? receivedAtMs : offsetMs + event.uptime_ms),
    );
  });
}

function splitByBoot(events: Timing[]): Timing[][] {
  const boots: Timing[][] = [];
  let previousUptimeMs = Number.POSITIVE_INFINITY;
  for (const event of events) {
    if (event.uptime_ms < previousUptimeMs) boots.push([]);
    boots.at(-1)?.push(event);
    previousUptimeMs = event.uptime_ms;
  }
  return boots;
}

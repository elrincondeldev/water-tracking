import type { NodeEvent } from "@gota/contracts";

export function rebaseSession(
  events: NodeEvent[],
  { seqStart, startMs, timeScale = 1 }: { seqStart: number; startMs: number; timeScale?: number },
): NodeEvent[] {
  const firstUptimeMs = events[0]?.uptime_ms ?? 0;
  return events.map((event, i) => ({
    ...event,
    seq: seqStart + i,
    t_ms:
      event.t_ms === null
        ? null
        : startMs + Math.round((event.uptime_ms - firstUptimeMs) * timeScale),
  }));
}

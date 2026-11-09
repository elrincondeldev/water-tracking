import type { NodeEvent } from "@gota/contracts";

export function rebaseSession(
  events: NodeEvent[],
  { seqStart, startMs }: { seqStart: number; startMs: number },
): NodeEvent[] {
  const firstUptimeMs = events[0]?.uptime_ms ?? 0;
  return events.map((event, i) => ({
    ...event,
    seq: seqStart + i,
    t_ms: event.t_ms === null ? null : startMs + event.uptime_ms - firstUptimeMs,
  }));
}

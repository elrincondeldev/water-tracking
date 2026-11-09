import { NODE_EVENT_BATCH_MAX, type NodeEvent, type NodeEventBatchAck } from "@gota/contracts";

export type ReplayOptions = {
  send: (events: NodeEvent[]) => Promise<NodeEventBatchAck>;
  speed: number;
  sleep?: (ms: number) => Promise<void>;
};

export async function replay(events: NodeEvent[], options: ReplayOptions): Promise<number> {
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  let acceptedSeq = 0;
  if (options.speed <= 0) {
    for (let i = 0; i < events.length; i += NODE_EVENT_BATCH_MAX) {
      acceptedSeq = (await options.send(events.slice(i, i + NODE_EVENT_BATCH_MAX))).accepted_seq;
    }
    return acceptedSeq;
  }
  let previousUptimeMs = events[0]?.uptime_ms ?? 0;
  for (const event of events) {
    await sleep((event.uptime_ms - previousUptimeMs) / options.speed);
    previousUptimeMs = event.uptime_ms;
    acceptedSeq = (await options.send([event])).accepted_seq;
  }
  return acceptedSeq;
}

import {
  NODE_PROTOCOL_VERSION,
  type NodeEvent,
  type NodeEventBatchAck,
  nodeEventBatchAckSchema,
} from "@gota/contracts";

export type Target = { url: string; token: string; deviceId: string; firmware: string };

export function batchSender(target: Target) {
  return async (events: NodeEvent[]): Promise<NodeEventBatchAck> => {
    const response = await fetch(new URL("/api/v1/node/events", target.url), {
      method: "POST",
      headers: { authorization: `Bearer ${target.token}`, "content-type": "application/json" },
      body: JSON.stringify({
        v: NODE_PROTOCOL_VERSION,
        device_id: target.deviceId,
        firmware: target.firmware,
        events,
      }),
    });
    if (!response.ok) throw new Error(`API answered ${response.status}: ${await response.text()}`);
    return nodeEventBatchAckSchema.parse(await response.json());
  };
}

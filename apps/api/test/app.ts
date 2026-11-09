import { NODE_EVENT_BATCH_MAX, type NodeEvent } from "@gota/contracts";
import { buildApp } from "../src/app";
import { testDatabase } from "./database";

export const TEST_TOKEN = "test-device-token-0123";

export function testApp(start = new Date("2026-11-09T13:00:00.000Z")) {
  const clock = { now: start };
  const db = testDatabase(new Date("2026-11-09T08:00:00.000Z"));
  const app = buildApp({ db, deviceToken: TEST_TOKEN, now: () => clock.now });

  async function sendEvents(events: NodeEvent[]) {
    for (let i = 0; i < events.length; i += NODE_EVENT_BATCH_MAX) {
      await sendBatch(events.slice(i, i + NODE_EVENT_BATCH_MAX));
    }
  }

  async function sendBatch(events: NodeEvent[]) {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/node/events",
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
      payload: { v: 1, device_id: "gota-3485180a1b2c", firmware: "1.0.0", events },
    });
    if (response.statusCode !== 200) throw new Error(response.body);
  }

  async function get(url: string) {
    const response = await app.inject({ method: "GET", url });
    return { status: response.statusCode, body: response.json() };
  }

  return { app, db, clock, sendEvents, get };
}

import type { NodeEvent } from "@gota/contracts";
import { afterEach, describe, expect, it } from "vitest";
import { testApp } from "./app";
import { loadEvents } from "./sessions";

let ctx: ReturnType<typeof testApp>;
afterEach(() => ctx.app.close());

const session = loadEvents("sips-and-refill");
const lastSeq = session.at(-1)?.seq ?? 0;
const later = (
  seq: number,
  event: { type: "removed" } | { type: "placed"; weight_g: number },
): NodeEvent => ({ ...event, seq: lastSeq + seq, t_ms: null, uptime_ms: 9_000_000 + seq * 1000 });

async function reset(payload?: object) {
  const response = await ctx.app.inject({
    method: "POST",
    url: "/api/v1/bottle/reset",
    ...(payload ? { payload } : {}),
  });
  return { status: response.statusCode, body: response.json() };
}

async function todayIntakes() {
  return (await ctx.get("/api/v1/history?from=2026-11-09&to=2026-11-09")).body.intakes;
}

describe("bottle endpoints", () => {
  it("shows the active bottle", async () => {
    ctx = testApp();
    expect((await ctx.get("/api/v1/bottle")).body).toEqual({
      id: 1,
      name: null,
      capacity_ml: null,
      started_at: "2026-11-09T08:00:00.000Z",
      ended_at: null,
      baseline_g: null,
    });
  });

  it("takes the bottle on the plate as the new baseline", async () => {
    ctx = testApp();
    await ctx.sendEvents(session);
    const { status, body } = await reset({ name: "Steel", capacity_ml: 1500 });
    expect(status).toBe(201);
    expect(body).toEqual({
      id: 2,
      name: "Steel",
      capacity_ml: 1500,
      started_at: "2026-11-09T13:00:00.000Z",
      ended_at: null,
      baseline_g: 1529.8,
    });

    await ctx.sendEvents([
      later(1, { type: "removed" }),
      later(2, { type: "placed", weight_g: 1300 }),
    ]);
    const sip = (await todayIntakes()).at(-1);
    expect([sip.kind, sip.volume_ml, sip.bottle_id]).toEqual(["sip", 230, 2]);
  });

  it("waits for the next placement when the plate is empty", async () => {
    ctx = testApp();
    await ctx.sendEvents([...session, later(1, { type: "removed" })]);
    expect((await reset()).body.baseline_g).toBeNull();

    const before = (await todayIntakes()).length;
    await ctx.sendEvents([later(2, { type: "placed", weight_g: 700 })]);
    expect(await todayIntakes()).toHaveLength(before);
    expect((await ctx.get("/api/v1/bottle")).body.baseline_g).toBe(700);
  });
});

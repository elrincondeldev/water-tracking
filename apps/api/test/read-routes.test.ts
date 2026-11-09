import { afterEach, describe, expect, it } from "vitest";
import { testApp } from "./app";
import { loadEvents } from "./sessions";

const session = loadEvents("sips-and-refill");
const secondSip = session.filter((e) => e.type === "placed")[2];

let ctx: ReturnType<typeof testApp>;
afterEach(() => ctx.app.close());

async function withSession() {
  ctx = testApp();
  await ctx.sendEvents(session);
  return ctx;
}

describe("GET /api/v1/summary/today", () => {
  it("summarizes a fresh install", async () => {
    ctx = testApp();
    expect((await ctx.get("/api/v1/summary/today")).body).toEqual({
      date: "2026-11-09",
      timezone: "Europe/Madrid",
      total_ml: 0,
      goal_ml: 2000,
      progress: 0,
      last_intake_at: null,
      bottle_weight_g: null,
    });
  });

  it("totals today's sips, ignoring the refill", async () => {
    const { get } = await withSession();
    expect((await get("/api/v1/summary/today")).body).toEqual({
      date: "2026-11-09",
      timezone: "Europe/Madrid",
      total_ml: 428,
      goal_ml: 2000,
      progress: 0.214,
      last_intake_at: new Date(secondSip?.t_ms ?? 0).toISOString(),
      bottle_weight_g: 1529.8,
    });
  });

  it("starts a new day at local midnight", async () => {
    const { get, clock } = await withSession();
    clock.now = new Date("2026-11-09T23:30:00.000Z");
    const body = (await get("/api/v1/summary/today")).body;
    expect([body.date, body.total_ml]).toEqual(["2026-11-10", 0]);
  });
});

describe("GET /api/v1/history", () => {
  it("returns daily buckets and the intakes in range", async () => {
    const { get } = await withSession();
    const { status, body } = await get("/api/v1/history?from=2026-11-08&to=2026-11-09");
    expect(status).toBe(200);
    expect(body.granularity).toBe("day");
    expect(body.buckets).toEqual([
      { start: "2026-11-08", total_ml: 0, goal_ml: 2000 },
      { start: "2026-11-09", total_ml: 428, goal_ml: 2000 },
    ]);
    expect(body.intakes.map((i: { kind: string }) => i.kind)).toEqual(["sip", "sip", "refill"]);
  });

  it("rejects an inverted range", async () => {
    ctx = testApp();
    const { status, body } = await ctx.get("/api/v1/history?from=2026-11-09&to=2026-11-01");
    expect(status).toBe(400);
    expect(body.error.code).toBe("invalid_request");
  });
});

describe("GET /api/v1/device", () => {
  it("is 404 until the node reports", async () => {
    ctx = testApp();
    expect((await ctx.get("/api/v1/device")).status).toBe(404);
  });

  it("reports the latest status and goes offline after silence", async () => {
    const { get, clock } = await withSession();
    expect((await get("/api/v1/device")).body).toEqual({
      id: "gota-3485180a1b2c",
      name: "Gota",
      firmware: "1.0.0",
      online: true,
      last_seen_at: "2026-11-09T13:00:00.000Z",
      weight_g: -0.3,
      rssi_dbm: -58,
      calibrated: true,
    });
    clock.now = new Date("2026-11-09T13:05:00.000Z");
    expect((await get("/api/v1/device")).body.online).toBe(false);
  });
});

describe("GET /api/v1/goal and /api/v1/settings", () => {
  it("returns the defaults", async () => {
    ctx = testApp();
    expect((await ctx.get("/api/v1/goal")).body).toEqual({
      daily_ml: 2000,
      effective_from: "2026-11-09",
    });
    expect((await ctx.get("/api/v1/settings")).body).toEqual({
      timezone: "Europe/Madrid",
      reminders: { enabled: true, idle_min: 90, pace_enabled: true },
      quiet_hours: { start: "22:00", end: "08:00" },
    });
  });
});

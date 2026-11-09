import { afterEach, describe, expect, it } from "vitest";
import { testApp } from "./app";
import { loadEvents } from "./sessions";

let ctx: ReturnType<typeof testApp>;
afterEach(() => ctx.app.close());

async function send(method: "POST" | "PATCH" | "DELETE", url: string, payload?: object) {
  const response = await ctx.app.inject({ method, url, ...(payload ? { payload } : {}) });
  return { status: response.statusCode, body: response.body ? response.json() : null };
}

async function todayTotal() {
  return (await ctx.get("/api/v1/summary/today")).body.total_ml;
}

describe("intake endpoints", () => {
  it("adds a manual intake at the current time by default", async () => {
    ctx = testApp();
    const { status, body } = await send("POST", "/api/v1/intakes", { volume_ml: 250 });
    expect(status).toBe(201);
    expect(body).toEqual({
      id: 1,
      kind: "manual",
      status: "counted",
      volume_ml: 250,
      occurred_at: "2026-11-09T13:00:00.000Z",
      bottle_id: null,
      source_event_id: null,
    });
    expect(await todayTotal()).toBe(250);
  });

  it("confirms a pending drop so it counts", async () => {
    ctx = testApp();
    await ctx.sendEvents(loadEvents("emptied-bottle"));
    const before = await todayTotal();
    const { body } = await send("PATCH", "/api/v1/intakes/1", { status: "counted" });
    expect([body.kind, body.status]).toEqual(["unclassified", "counted"]);
    expect(await todayTotal()).toBe(before + 1111);
  });

  it("corrects a sip's volume", async () => {
    ctx = testApp();
    await ctx.sendEvents(loadEvents("sips-and-refill"));
    await send("PATCH", "/api/v1/intakes/1", { volume_ml: 200 });
    expect(await todayTotal()).toBe(428 - 44);
  });

  it("discards a derived intake on delete and keeps it in history", async () => {
    ctx = testApp();
    await ctx.sendEvents(loadEvents("sips-and-refill"));
    expect((await send("DELETE", "/api/v1/intakes/1")).status).toBe(204);
    const history = await ctx.get("/api/v1/history?from=2026-11-09&to=2026-11-09");
    expect(history.body.intakes[0].status).toBe("discarded");
    expect(await todayTotal()).toBe(184);
  });

  it("removes a manual intake on delete", async () => {
    ctx = testApp();
    await send("POST", "/api/v1/intakes", { volume_ml: 250 });
    await send("DELETE", "/api/v1/intakes/1");
    const history = await ctx.get("/api/v1/history?from=2026-11-09&to=2026-11-09");
    expect(history.body.intakes).toEqual([]);
  });

  it.each([
    ["PATCH", { status: "counted" }],
    ["DELETE", undefined],
  ] as const)("answers 404 to %s on a missing intake", async (method, payload) => {
    ctx = testApp();
    expect((await send(method, "/api/v1/intakes/99", payload)).status).toBe(404);
  });

  it("rejects a manual intake without a volume", async () => {
    ctx = testApp();
    expect((await send("POST", "/api/v1/intakes", {})).status).toBe(400);
  });
});

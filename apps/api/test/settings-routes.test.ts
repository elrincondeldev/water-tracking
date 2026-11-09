import { afterEach, describe, expect, it } from "vitest";
import { testApp } from "./app";

let ctx: ReturnType<typeof testApp>;
afterEach(() => ctx.app.close());

const settings = {
  timezone: "America/New_York",
  reminders: { enabled: false, idle_min: 60, pace_enabled: false },
  quiet_hours: { start: "23:00", end: "07:30" },
};

async function putSettings(payload: object) {
  const response = await ctx.app.inject({ method: "PUT", url: "/api/v1/settings", payload });
  return { status: response.statusCode, body: response.json() };
}

describe("PUT /api/v1/settings", () => {
  it("replaces the settings", async () => {
    ctx = testApp();
    expect((await putSettings(settings)).body).toEqual(settings);
    expect((await ctx.get("/api/v1/settings")).body).toEqual(settings);
  });

  it("aggregates days in the new timezone", async () => {
    ctx = testApp(new Date("2026-11-10T03:00:00.000Z"));
    await putSettings(settings);
    expect((await ctx.get("/api/v1/summary/today")).body.date).toBe("2026-11-09");
  });

  it("rejects an unknown timezone", async () => {
    ctx = testApp();
    expect((await putSettings({ ...settings, timezone: "Mars/Olympus" })).status).toBe(400);
  });
});

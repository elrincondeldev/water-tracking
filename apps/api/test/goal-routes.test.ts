import { afterEach, describe, expect, it } from "vitest";
import { testApp } from "./app";

let ctx: ReturnType<typeof testApp>;
afterEach(() => ctx.app.close());

async function putGoal(daily_ml: number) {
  const response = await ctx.app.inject({
    method: "PUT",
    url: "/api/v1/goal",
    payload: { daily_ml },
  });
  return { status: response.statusCode, body: response.json() };
}

describe("PUT /api/v1/goal", () => {
  it("sets the goal from today without rewriting past days", async () => {
    ctx = testApp(new Date("2026-11-12T10:00:00.000Z"));
    expect((await putGoal(2500)).body).toEqual({ daily_ml: 2500, effective_from: "2026-11-12" });
    const history = await ctx.get("/api/v1/history?from=2026-11-11&to=2026-11-12");
    expect(history.body.buckets.map((b: { goal_ml: number }) => b.goal_ml)).toEqual([2000, 2500]);
  });

  it("replaces a goal set earlier the same day", async () => {
    ctx = testApp(new Date("2026-11-12T10:00:00.000Z"));
    await putGoal(2500);
    await putGoal(2200);
    expect((await ctx.get("/api/v1/goal")).body).toEqual({
      daily_ml: 2200,
      effective_from: "2026-11-12",
    });
  });

  it("rejects an unrealistic goal", async () => {
    ctx = testApp();
    expect((await putGoal(50)).status).toBe(400);
  });
});

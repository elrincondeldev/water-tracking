import { afterEach, describe, expect, it } from "vitest";
import { testApp } from "./app";

let ctx: ReturnType<typeof testApp>;
afterEach(() => ctx.app.close());

async function get(origin: string) {
  ctx = testApp();
  return ctx.app.inject({ method: "GET", url: "/api/v1/summary/today", headers: { origin } });
}

describe("CORS", () => {
  it.each(["tauri://localhost", "http://tauri.localhost", "http://localhost:1420"])(
    "allows the desktop app at %s",
    async (origin) => {
      expect((await get(origin)).headers["access-control-allow-origin"]).toBe(origin);
    },
  );

  it("allows preflight for writes from the desktop app", async () => {
    ctx = testApp();
    const response = await ctx.app.inject({
      method: "OPTIONS",
      url: "/api/v1/intakes",
      headers: {
        origin: "tauri://localhost",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });
    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("tauri://localhost");
  });

  it("does not allow other websites", async () => {
    expect(
      (await get("https://example.com")).headers["access-control-allow-origin"],
    ).toBeUndefined();
  });
});

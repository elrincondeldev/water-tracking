import { afterEach, describe, expect, it } from "vitest";
import { testDatabase } from "../../test/database";
import { loadEvents } from "../../test/sessions";
import { buildApp } from "../app";

const TOKEN = "test-device-token-0123";
const events = loadEvents("sips-and-refill");
const body = {
  v: 1,
  device_id: "gota-3485180a1b2c",
  firmware: "1.0.0",
  events: events.slice(0, 5),
};

let app: ReturnType<typeof buildApp>;
afterEach(() => app.close());

function post(payload: unknown, authorization: string | null = `Bearer ${TOKEN}`) {
  app = buildApp({ db: testDatabase(), deviceToken: TOKEN });
  return app.inject({
    method: "POST",
    url: "/api/v1/node/events",
    payload: payload as object,
    headers: authorization === null ? {} : { authorization },
  });
}

describe("POST /api/v1/node/events", () => {
  it("acknowledges the highest stored seq", async () => {
    const response = await post(body);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ v: 1, accepted_seq: events[4]?.seq });
  });

  it.each([
    ["no token", null],
    ["a wrong token", "Bearer not-the-token"],
    ["a non-bearer scheme", `Basic ${TOKEN}`],
  ])("rejects %s with 401", async (_name, authorization) => {
    const response = await post(body, authorization);
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: { code: "unauthorized", message: "Missing or invalid device token" },
    });
  });

  it("rejects a body that breaks the protocol with 400", async () => {
    const response = await post({ ...body, v: 2 });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("invalid_request");
  });

  it("checks the token before the body", async () => {
    expect((await post({ nonsense: true }, null)).statusCode).toBe(401);
  });
});

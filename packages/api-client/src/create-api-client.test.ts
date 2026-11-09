import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";
import { createApiClient } from "./create-api-client";

type Call = { url: string; method: string; body: unknown };

function fakeFetch(status: number, body: unknown) {
  const calls: Call[] = [];
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  };
  return { calls, fetch };
}

const summary = {
  date: "2026-11-09",
  timezone: "Europe/Madrid",
  total_ml: 112,
  goal_ml: 2000,
  progress: 0.056,
  last_intake_at: "2026-11-09T21:24:38.568Z",
  bottle_weight_g: 1418.1,
};

describe("createApiClient", () => {
  it("gets and validates today's summary under the base URL", async () => {
    const { calls, fetch } = fakeFetch(200, summary);
    const client = createApiClient({ baseUrl: "http://gota.lan:3000", fetch });
    expect(await client.getTodaySummary()).toEqual(summary);
    expect(calls).toEqual([
      { url: "http://gota.lan:3000/api/v1/summary/today", method: "GET", body: undefined },
    ]);
  });

  it("builds the history query with a default granularity", async () => {
    const { calls, fetch } = fakeFetch(200, {
      timezone: "Europe/Madrid",
      granularity: "day",
      buckets: [],
      intakes: [],
    });
    await createApiClient({ fetch }).getHistory({ from: "2026-11-01", to: "2026-11-09" });
    expect(calls[0]?.url).toBe(
      "/api/v1/history?from=2026-11-01&to=2026-11-09&granularity=day&intakes=true",
    );
  });

  it("sends JSON bodies for writes", async () => {
    const { calls, fetch } = fakeFetch(200, {
      id: 3,
      kind: "sip",
      status: "discarded",
      volume_ml: 66,
      occurred_at: "2026-11-09T21:24:38.568Z",
      bottle_id: 1,
      source_event_id: 32,
    });
    await createApiClient({ fetch }).updateIntake(3, { status: "discarded" });
    expect(calls[0]).toEqual({
      url: "/api/v1/intakes/3",
      method: "PATCH",
      body: { status: "discarded" },
    });
  });

  it("throws the API error code and message", async () => {
    const { fetch } = fakeFetch(400, { error: { code: "invalid_request", message: "bad goal" } });
    const error = await createApiClient({ fetch })
      .putGoal({ daily_ml: 1 })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "invalid_request", message: "bad goal" });
  });

  it("returns null when no device has reported yet", async () => {
    const { fetch } = fakeFetch(404, { error: { code: "not_found", message: "none" } });
    expect(await createApiClient({ fetch }).getDevice()).toBeNull();
  });

  it("rejects a response that breaks the contract", async () => {
    const { fetch } = fakeFetch(200, { ...summary, total_ml: "a lot" });
    await expect(createApiClient({ fetch }).getTodaySummary()).rejects.toThrow();
  });

  it("deletes without expecting a body", async () => {
    const { calls, fetch } = fakeFetch(204, undefined);
    await createApiClient({ fetch }).deleteIntake(9);
    expect(calls[0]?.method).toBe("DELETE");
  });
});

import type { AddressInfo } from "node:net";
import { batchSender, loadSession, rebaseSession, replay } from "node-sim";
import { afterEach, describe, expect, it } from "vitest";
import { TEST_TOKEN, testApp } from "./app";
import { loadExpected, sessionNames } from "./sessions";

let ctx: ReturnType<typeof testApp>;
afterEach(() => ctx.app.close());

describe("node-sim against the API", () => {
  it.each(sessionNames)("replaying %s over HTTP yields the expected intakes", async (name) => {
    ctx = testApp(new Date("2026-11-09T18:00:00.000Z"));
    await ctx.app.listen({ host: "127.0.0.1", port: 0 });
    const { port } = ctx.app.server.address() as AddressInfo;
    const send = batchSender({
      url: `http://127.0.0.1:${port}`,
      token: TEST_TOKEN,
      deviceId: "gota-sim",
      firmware: "sim",
    });

    const events = rebaseSession(loadSession(name), {
      seqStart: 1_000,
      startMs: Date.parse("2026-11-09T12:00:00.000Z"),
    });
    expect(await replay(events, { send, speed: 0 })).toBe(events.at(-1)?.seq);

    const history = await ctx.get("/api/v1/history?from=2026-11-09&to=2026-11-09");
    expect(
      history.body.intakes.map((i: { kind: string; volume_ml: number }) => [i.kind, i.volume_ml]),
    ).toEqual(loadExpected(name).map((i) => [i.kind, i.volume_ml]));
  });
});

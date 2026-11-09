import type { AddressInfo } from "node:net";
import { streamEventSchema } from "@gota/contracts";
import { afterEach, describe, expect, it } from "vitest";
import { testApp } from "./app";
import { loadEvents } from "./sessions";

let ctx: ReturnType<typeof testApp>;
afterEach(() => ctx.app.close());

async function openStream() {
  ctx = testApp();
  await ctx.app.listen({ host: "127.0.0.1", port: 0 });
  const { port } = ctx.app.server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/stream`, {
    headers: { origin: "tauri://localhost" },
  });
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("no stream body");
  let buffer = "";

  async function next(count: number) {
    const frames: string[] = [];
    while (frames.length < count) {
      const end = buffer.indexOf("\n\n");
      if (end >= 0) {
        frames.push(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        continue;
      }
      const chunk = await reader?.read();
      if (!chunk || chunk.done) throw new Error("stream ended");
      buffer += decoder.decode(chunk.value, { stream: true });
    }
    return frames.map((frame) => {
      const type = frame.match(/^event: (.+)$/m)?.[1];
      const data = frame.match(/^data: (.+)$/m)?.[1];
      return streamEventSchema.parse({ type, data: JSON.parse(data ?? "null") });
    });
  }

  return { response, next, reader };
}

describe("GET /api/v1/stream", () => {
  it("starts with the current summary", async () => {
    const { response, next } = await openStream();
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(response.headers.get("access-control-allow-origin")).toBe("tauri://localhost");
    const [first] = await next(1);
    expect(first?.type).toBe("summary");
  });

  it("pushes a new intake and the updated summary", async () => {
    const { next } = await openStream();
    await next(1);
    await ctx.app.inject({ method: "POST", url: "/api/v1/intakes", payload: { volume_ml: 250 } });
    const events = await next(2);
    expect(events.map((e) => e.type)).toEqual(["intake", "summary"]);
    expect(events[1]?.type === "summary" && events[1].data.total_ml).toBe(250);
  });

  it("pushes device status and derived intakes after ingest", async () => {
    const { next } = await openStream();
    await next(1);
    await ctx.sendEvents(loadEvents("refill-in-place").slice(0, 10));
    const events = await next(3);
    expect(events.map((e) => e.type)).toEqual(["device", "intake", "summary"]);
  });

  it("ends open streams when the server closes", async () => {
    const { next, reader } = await openStream();
    await next(1);
    await ctx.app.close();
    expect((await reader.read()).done).toBe(true);
  });
});

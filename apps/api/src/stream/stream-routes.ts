import type { ServerResponse } from "node:http";
import type { StreamEvent } from "@gota/contracts";
import type { FastifyPluginAsync } from "fastify";
import type { LiveUpdates } from "./live-updates";

export const KEEP_ALIVE_MS = 30_000;

export const streamRoutes: FastifyPluginAsync<{ live: LiveUpdates }> = async (app, { live }) => {
  const open = new Set<ServerResponse>();
  app.addHook("preClose", async () => {
    for (const response of open) response.end();
  });

  app.get("/stream", (request, reply) => {
    reply.hijack();
    const response = reply.raw;
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    const send = (event: StreamEvent) =>
      response.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);

    for (const event of live.snapshot()) send(event);
    const unsubscribe = live.subscribe(send);
    const keepAlive = setInterval(() => {
      const device = live.deviceSnapshot();
      if (device.length === 0) response.write(": keep-alive\n\n");
      for (const event of device) send(event);
    }, KEEP_ALIVE_MS);
    open.add(response);

    request.raw.on("close", () => {
      clearInterval(keepAlive);
      unsubscribe();
      open.delete(response);
    });
  });
};

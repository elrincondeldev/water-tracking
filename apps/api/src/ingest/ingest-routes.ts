import {
  apiErrorSchema,
  NODE_PROTOCOL_VERSION,
  type NodeEventBatchAck,
  nodeEventBatchAckSchema,
  nodeEventBatchSchema,
} from "@gota/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/open-database";
import { deviceAuth } from "../http/device-auth";
import { ingestBatch } from "./ingest-batch";

export type IngestRoutesOptions = { db: Db; deviceToken: string; now: () => Date };

export const ingestRoutes: FastifyPluginAsyncZod<IngestRoutesOptions> = async (app, options) => {
  app.post(
    "/node/events",
    {
      onRequest: deviceAuth(options.deviceToken),
      schema: {
        body: nodeEventBatchSchema,
        response: { 200: nodeEventBatchAckSchema, 400: apiErrorSchema, 401: apiErrorSchema },
      },
    },
    async (request) => {
      const { accepted_seq, gaps } = ingestBatch(options.db, request.body, options.now());
      for (const gap of gaps) {
        request.log.warn({ device_id: request.body.device_id, ...gap }, "missing node events");
      }
      return { v: NODE_PROTOCOL_VERSION, accepted_seq } satisfies NodeEventBatchAck;
    },
  );
};

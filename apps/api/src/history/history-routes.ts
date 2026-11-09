import { historyQuerySchema, historyResponseSchema } from "@gota/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/open-database";
import { getHistory } from "./get-history";

export const historyRoutes: FastifyPluginAsyncZod<{ db: Db }> = async (app, { db }) => {
  app.get(
    "/history",
    { schema: { querystring: historyQuerySchema, response: { 200: historyResponseSchema } } },
    async (request) => getHistory(db, request.query),
  );
};

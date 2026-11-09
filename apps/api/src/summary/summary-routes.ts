import { todaySummarySchema } from "@gota/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/open-database";
import { getTodaySummary } from "./get-today-summary";

export type SummaryRoutesOptions = { db: Db; now: () => Date };

export const summaryRoutes: FastifyPluginAsyncZod<SummaryRoutesOptions> = async (app, options) => {
  app.get("/summary/today", { schema: { response: { 200: todaySummarySchema } } }, async () =>
    getTodaySummary(options.db, options.now()),
  );
};

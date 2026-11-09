import { bottleSchema, resetBottleRequestSchema } from "@gota/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/open-database";
import type { LiveUpdates } from "../stream/live-updates";
import { getCurrentBottle, resetBottle } from "./reset-bottle";

export type BottleRoutesOptions = { db: Db; now: () => Date; live: LiveUpdates };

export const bottleRoutes: FastifyPluginAsyncZod<BottleRoutesOptions> = async (
  app,
  { db, now, live },
) => {
  app.get("/bottle", { schema: { response: { 200: bottleSchema } } }, async () =>
    getCurrentBottle(db),
  );

  app.post(
    "/bottle/reset",
    { schema: { body: resetBottleRequestSchema.nullish(), response: { 201: bottleSchema } } },
    async (request, reply) => {
      const bottle = resetBottle(db, request.body ?? {}, now());
      live.publishSummary();
      return reply.code(201).send(bottle);
    },
  );
};

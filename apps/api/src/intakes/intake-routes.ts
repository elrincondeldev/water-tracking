import {
  apiErrorSchema,
  createIntakeRequestSchema,
  intakeSchema,
  updateIntakeRequestSchema,
} from "@gota/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import type { Db } from "../db/open-database";
import { apiError } from "../http/error-handler";
import type { LiveUpdates } from "../stream/live-updates";
import { createManualIntake, deleteIntake, updateIntake } from "./mutate-intakes";

export type IntakeRoutesOptions = { db: Db; now: () => Date; live: LiveUpdates };

const paramsSchema = z.object({ id: z.coerce.number().int().min(1) });
const notFound = apiError("not_found", "Intake not found");

export const intakeRoutes: FastifyPluginAsyncZod<IntakeRoutesOptions> = async (
  app,
  { db, now, live },
) => {
  app.post(
    "/intakes",
    { schema: { body: createIntakeRequestSchema, response: { 201: intakeSchema } } },
    async (request, reply) => {
      const intake = createManualIntake(db, request.body, now());
      live.publishIntakes([intake]);
      return reply.code(201).send(intake);
    },
  );

  app.patch(
    "/intakes/:id",
    {
      schema: {
        params: paramsSchema,
        body: updateIntakeRequestSchema,
        response: { 200: intakeSchema, 404: apiErrorSchema },
      },
    },
    async (request, reply) => {
      const intake = updateIntake(db, request.params.id, request.body, now());
      if (!intake) return reply.code(404).send(notFound);
      live.publishIntakes([intake]);
      return intake;
    },
  );

  app.delete(
    "/intakes/:id",
    { schema: { params: paramsSchema, response: { 204: z.null(), 404: apiErrorSchema } } },
    async (request, reply) => {
      if (!deleteIntake(db, request.params.id, now())) return reply.code(404).send(notFound);
      live.publishSummary();
      return reply.code(204).send(null);
    },
  );
};

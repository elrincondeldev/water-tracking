import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { Db } from "./db/open-database";
import { apiError, errorHandler } from "./http/error-handler";
import { ingestRoutes } from "./ingest/ingest-routes";

export type AppOptions = {
  db: Db;
  deviceToken: string;
  now?: () => Date;
  logger?: boolean;
};

export function buildApp({ db, deviceToken, now = () => new Date(), logger = false }: AppOptions) {
  const app = Fastify({ logger });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send(apiError("not_found", "Route not found")),
  );
  app.register(ingestRoutes, { prefix: "/api/v1", db, deviceToken, now });
  return app;
}

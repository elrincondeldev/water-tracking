import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { Db } from "./db/open-database";
import { goalRoutes } from "./goal/goal-routes";
import { apiError, errorHandler } from "./http/error-handler";
import { ingestRoutes } from "./ingest/ingest-routes";
import { settingsRoutes } from "./settings/settings-routes";

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
  const prefix = "/api/v1";
  app.register(ingestRoutes, { prefix, db, deviceToken, now });
  app.register(goalRoutes, { prefix, db, now });
  app.register(settingsRoutes, { prefix, db });
  return app;
}

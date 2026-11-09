import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { bottleRoutes } from "./bottle/bottle-routes";
import type { Db } from "./db/open-database";
import { deviceRoutes } from "./device/device-routes";
import { goalRoutes } from "./goal/goal-routes";
import { historyRoutes } from "./history/history-routes";
import { apiError, errorHandler } from "./http/error-handler";
import { ingestRoutes } from "./ingest/ingest-routes";
import { intakeRoutes } from "./intakes/intake-routes";
import { settingsRoutes } from "./settings/settings-routes";
import { summaryRoutes } from "./summary/summary-routes";

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
  app.register(summaryRoutes, { prefix, db, now });
  app.register(historyRoutes, { prefix, db });
  app.register(deviceRoutes, { prefix, db, now });
  app.register(goalRoutes, { prefix, db, now });
  app.register(settingsRoutes, { prefix, db });
  app.register(intakeRoutes, { prefix, db, now });
  app.register(bottleRoutes, { prefix, db, now });
  return app;
}

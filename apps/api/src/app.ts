import cors from "@fastify/cors";
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
import { createLiveUpdates } from "./stream/live-updates";
import { streamRoutes } from "./stream/stream-routes";
import { summaryRoutes } from "./summary/summary-routes";

// The macOS app's webview: bundled (macOS uses tauri://, other platforms the http form) and dev.
export const DESKTOP_ORIGINS = [
  "tauri://localhost",
  "http://tauri.localhost",
  "http://localhost:1420",
];

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
  app.register(cors, { origin: DESKTOP_ORIGINS });
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send(apiError("not_found", "Route not found")),
  );
  const prefix = "/api/v1";
  const live = createLiveUpdates(db, now);
  app.register(ingestRoutes, { prefix, db, deviceToken, now, live });
  app.register(summaryRoutes, { prefix, db, now });
  app.register(historyRoutes, { prefix, db });
  app.register(deviceRoutes, { prefix, db, now });
  app.register(goalRoutes, { prefix, db, now, live });
  app.register(settingsRoutes, { prefix, db, live });
  app.register(intakeRoutes, { prefix, db, now, live });
  app.register(bottleRoutes, { prefix, db, now, live });
  app.register(streamRoutes, { prefix, live });
  return app;
}

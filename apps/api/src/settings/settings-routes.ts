import { putSettingsRequestSchema, settingsSchema } from "@gota/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/open-database";
import type { LiveUpdates } from "../stream/live-updates";
import { getSettings } from "./get-settings";
import { putSettings } from "./put-settings";

export const settingsRoutes: FastifyPluginAsyncZod<{ db: Db; live: LiveUpdates }> = async (
  app,
  { db, live },
) => {
  app.get("/settings", { schema: { response: { 200: settingsSchema } } }, async () =>
    getSettings(db),
  );

  app.put(
    "/settings",
    { schema: { body: putSettingsRequestSchema, response: { 200: settingsSchema } } },
    async (request) => {
      const settings = putSettings(db, request.body);
      live.publishSummary();
      return settings;
    },
  );
};

import { settingsSchema } from "@gota/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/open-database";
import { getSettings } from "./get-settings";

export const settingsRoutes: FastifyPluginAsyncZod<{ db: Db }> = async (app, { db }) => {
  app.get("/settings", { schema: { response: { 200: settingsSchema } } }, async () =>
    getSettings(db),
  );
};

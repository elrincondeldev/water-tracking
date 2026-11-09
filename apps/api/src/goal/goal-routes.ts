import { goalSchema } from "@gota/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/open-database";
import { goalInEffect, localDate } from "../domain/history";
import { getSettings } from "../settings/get-settings";
import { listGoals } from "./list-goals";

export type GoalRoutesOptions = { db: Db; now: () => Date };

export const goalRoutes: FastifyPluginAsyncZod<GoalRoutesOptions> = async (app, { db, now }) => {
  app.get("/goal", { schema: { response: { 200: goalSchema } } }, async () => {
    const today = localDate(now().toISOString(), getSettings(db).timezone);
    const goal = goalInEffect(today, listGoals(db));
    if (!goal) throw new Error("no goal; ensureDefaults must run at startup");
    return goal;
  });
};

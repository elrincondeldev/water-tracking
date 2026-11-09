import { goalSchema, putGoalRequestSchema } from "@gota/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/open-database";
import { goalInEffect, localDate } from "../domain/history";
import { getSettings } from "../settings/get-settings";
import type { LiveUpdates } from "../stream/live-updates";
import { listGoals } from "./list-goals";
import { putGoal } from "./put-goal";

export type GoalRoutesOptions = { db: Db; now: () => Date; live: LiveUpdates };

export const goalRoutes: FastifyPluginAsyncZod<GoalRoutesOptions> = async (
  app,
  { db, now, live },
) => {
  app.get("/goal", { schema: { response: { 200: goalSchema } } }, async () => {
    const today = localDate(now().toISOString(), getSettings(db).timezone);
    const goal = goalInEffect(today, listGoals(db));
    if (!goal) throw new Error("no goal; ensureDefaults must run at startup");
    return goal;
  });

  app.put(
    "/goal",
    { schema: { body: putGoalRequestSchema, response: { 200: goalSchema } } },
    async (request) => {
      const goal = putGoal(db, request.body, now());
      live.publishSummary();
      return goal;
    },
  );
};

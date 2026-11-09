import { apiErrorSchema, deviceSchema } from "@gota/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/open-database";
import { apiError } from "../http/error-handler";
import { getDevice } from "./get-device";

export type DeviceRoutesOptions = { db: Db; now: () => Date };

export const deviceRoutes: FastifyPluginAsyncZod<DeviceRoutesOptions> = async (app, options) => {
  app.get(
    "/device",
    { schema: { response: { 200: deviceSchema, 404: apiErrorSchema } } },
    async (_request, reply) => {
      const device = getDevice(options.db, options.now());
      if (!device) return reply.code(404).send(apiError("not_found", "No device has reported yet"));
      return device;
    },
  );
};

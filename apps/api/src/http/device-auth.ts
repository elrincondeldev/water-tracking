import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { apiError } from "./error-handler";

export function deviceAuth(deviceToken: string) {
  const expected = digest(deviceToken);
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (token === undefined || !timingSafeEqual(digest(token), expected)) {
      return reply.code(401).send(apiError("unauthorized", "Missing or invalid device token"));
    }
  };
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

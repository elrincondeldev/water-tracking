import type { ApiError } from "@gota/contracts";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";

export function apiError(code: string, message: string): ApiError {
  return { error: { code, message } };
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.code(400).send(apiError("invalid_request", error.message));
  }
  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 500) {
    request.log.error(error);
    return reply.code(500).send(apiError("internal", "Internal server error"));
  }
  return reply.code(statusCode).send(apiError(error.code ?? "error", error.message));
}

import type { FastifyInstance, FastifyReply } from "fastify";
import type { ApiErrorResponse } from "../types/apiError.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    sendError(reply, 404, {
      code: "NOT_FOUND",
      message: "Route not found.",
      requestId: request.id
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = getStatusCode(error);
    const code = statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST";
    const message = statusCode >= 500 ? "Unexpected server error." : getErrorMessage(error);

    request.log.error(error);

    sendError(reply, statusCode, {
      code,
      message,
      requestId: request.id
    });
  });
}

function getStatusCode(error: unknown): number {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const statusCode = Number(error.statusCode);
    return Number.isInteger(statusCode) && statusCode >= 400 ? statusCode : 500;
  }

  return 500;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed.";
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  error: ApiErrorResponse["error"]
): FastifyReply {
  return reply.status(statusCode).send({ error } satisfies ApiErrorResponse);
}

import type { FastifyInstance, FastifyReply } from "fastify";
import type { ApiErrorCode, ApiErrorResponse } from "@qa-assist/shared";

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
    const code: ApiErrorCode = getErrorCode(error) ?? (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST");
    const message = statusCode >= 500 && !shouldExposeMessage(error) ? "Unexpected server error." : getErrorMessage(error);

    request.log.error(error);

    sendError(reply, statusCode, {
      code,
      message,
      requestId: request.id
    });
  });
}

function shouldExposeMessage(error: unknown): boolean {
  return typeof error === "object" && error !== null && "exposeMessage" in error && error.exposeMessage === true;
}

function getErrorCode(error: unknown): ApiErrorCode | undefined {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code as ApiErrorCode;
  }

  return undefined;
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

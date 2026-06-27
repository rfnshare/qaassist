import type { FastifyInstance } from "fastify";
import type { WritebackHelperType, WritebackPreviewRequest } from "@qa-assist/shared";
import { buildWritebackPreview } from "../writeback/writebackHelper.service.js";

type WritebackPreviewBody = Partial<Record<keyof WritebackPreviewRequest, unknown>>;

const HELPER_TYPES: WritebackHelperType[] = [
  "bug-draft",
  "comment-draft",
  "state-transition",
  "attachment-metadata"
];
const SENSITIVE_BODY_KEYS = new Set(["pat", "token", "authorization", "password", "secret", "apikey", "api_key"]);

export async function registerWritebackRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: WritebackPreviewBody }>("/writeback/preview", async (request) => {
    const input = validateWritebackPreviewBody(request.body);

    return buildWritebackPreview(input);
  });
}

function validateWritebackPreviewBody(body: WritebackPreviewBody | undefined): WritebackPreviewRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  if (containsSensitiveKey(body)) {
    throw badRequest("Request body must not include secrets or tokens.");
  }

  if (!HELPER_TYPES.includes(body.helperType as WritebackHelperType)) {
    throw badRequest("helperType is invalid.");
  }

  if (body.helperType === "state-transition" && !isNonEmptyString(body.targetState)) {
    throw badRequest("targetState is required for state-transition helper.");
  }

  if (body.selectedEvidence !== undefined && !Array.isArray(body.selectedEvidence)) {
    throw badRequest("selectedEvidence must be an array.");
  }

  return {
    helperType: body.helperType as WritebackHelperType,
    workItemDetail: isObject(body.workItemDetail) ? body.workItemDetail as WritebackPreviewRequest["workItemDetail"] : undefined,
    reviewSession: isObject(body.reviewSession) ? body.reviewSession as WritebackPreviewRequest["reviewSession"] : undefined,
    selectedEvidence: Array.isArray(body.selectedEvidence) ? body.selectedEvidence as WritebackPreviewRequest["selectedEvidence"] : undefined,
    userNotes: normalizeOptionalString(body.userNotes),
    targetState: normalizeOptionalString(body.targetState),
    attachmentMetadata: isObject(body.attachmentMetadata)
      ? body.attachmentMetadata as WritebackPreviewRequest["attachmentMetadata"]
      : undefined
  };
}

function containsSensitiveKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsSensitiveKey);
  }

  if (!isObject(value)) {
    return false;
  }

  return Object.entries(value).some(([key, child]) =>
    SENSITIVE_BODY_KEYS.has(key.toLowerCase()) || containsSensitiveKey(child)
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

import type { FastifyInstance } from "fastify";
import type { TestCaseReviewSession, TestPlansReadinessRequest, TestPlansTargetSettings } from "@qa-assist/shared";
import { buildTestPlansReadinessPreview } from "../test-management/testPlansReadiness.service.js";

type TestPlansReadinessBody = {
  reviewSession?: unknown;
  targetSettings?: unknown;
};

export async function registerTestPlansReadinessRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: TestPlansReadinessBody }>("/test-plans/readiness/preview", async (request) => {
    const input = validateReadinessBody(request.body);

    return buildTestPlansReadinessPreview(input);
  });
}

function validateReadinessBody(body: TestPlansReadinessBody | undefined): TestPlansReadinessRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  const reviewSession = validateReviewSession(body.reviewSession);
  const targetSettings = validateTargetSettings(body.targetSettings);

  return { reviewSession, targetSettings };
}

function validateReviewSession(value: unknown): TestCaseReviewSession {
  if (!isObject(value)) {
    throw badRequest("reviewSession is required.");
  }

  if (!Array.isArray(value.reviewedCases)) {
    throw badRequest("reviewSession.reviewedCases must be an array.");
  }

  return value as TestCaseReviewSession;
}

function validateTargetSettings(value: unknown): TestPlansTargetSettings {
  if (!isObject(value)) {
    throw badRequest("targetSettings is required.");
  }

  if (!isNonEmptyString(value.organization)) {
    throw badRequest("targetSettings.organization is required.");
  }

  if (!isNonEmptyString(value.project)) {
    throw badRequest("targetSettings.project is required.");
  }

  if (!isNonEmptyString(value.team)) {
    throw badRequest("targetSettings.team is required.");
  }

  return {
    organization: value.organization.trim(),
    project: value.project.trim(),
    team: value.team.trim(),
    testPlanId: normalizeOptionalStringOrNumber(value.testPlanId),
    testSuiteId: normalizeOptionalStringOrNumber(value.testSuiteId),
    areaPath: normalizeOptionalString(value.areaPath),
    iterationPath: normalizeOptionalString(value.iterationPath)
  };
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

function normalizeOptionalStringOrNumber(value: unknown): string | number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return normalizeOptionalString(value);
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

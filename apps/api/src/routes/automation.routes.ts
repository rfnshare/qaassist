import type { FastifyInstance } from "fastify";
import type {
  AutomationCandidateMappingRequest,
  AutomationMappingOptions,
  TestCaseReviewSession
} from "@qa-assist/shared";
import { mapAutomationCandidates } from "../automation/automationCandidate.service.js";

type AutomationCandidateBody = {
  reviewSession?: unknown;
  mappingOptions?: unknown;
};

export async function registerAutomationRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: AutomationCandidateBody }>("/automation/candidates/map", async (request) => {
    const input = validateAutomationCandidateBody(request.body);

    return mapAutomationCandidates(input);
  });
}

function validateAutomationCandidateBody(body: AutomationCandidateBody | undefined): AutomationCandidateMappingRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  const reviewSession = validateReviewSession(body.reviewSession);
  const mappingOptions = validateMappingOptions(body.mappingOptions);

  return { reviewSession, mappingOptions };
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

function validateMappingOptions(value: unknown): AutomationMappingOptions | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isObject(value)) {
    throw badRequest("mappingOptions must be an object.");
  }

  const options: AutomationMappingOptions = {};

  for (const key of ["preferUi", "preferApi", "includeBlocked"] as const) {
    if (value[key] !== undefined && typeof value[key] !== "boolean") {
      throw badRequest(`mappingOptions.${key} must be a boolean.`);
    }

    if (typeof value[key] === "boolean") {
      options[key] = value[key];
    }
  }

  return options;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

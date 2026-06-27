import type { FastifyInstance } from "fastify";
import type {
  TestPlansCreationConfirmation,
  TestPlansCreationRequest,
  TestPlansReadinessResult
} from "@qa-assist/shared";
import type { ApiEnv } from "../config/env.js";
import { getAzureDevOpsRuntimeConfig } from "../integrations/azure-devops/azureDevOpsConfig.js";
import { createAzureTestPlansClient } from "../test-management/azureTestPlansClient.js";
import { createExplicitTestPlansCases } from "../test-management/testPlansCreation.service.js";

type TestPlansCreationBody = {
  readinessResult?: unknown;
  selectedCandidateIds?: unknown;
  confirmation?: unknown;
};

const SENSITIVE_BODY_KEYS = new Set(["pat", "token", "authorization", "password", "secret"]);

export async function registerTestPlansCreationRoutes(app: FastifyInstance, env: ApiEnv): Promise<void> {
  const client = createAzureTestPlansClient(getAzureDevOpsRuntimeConfig(env));

  app.post<{ Body: TestPlansCreationBody }>("/test-plans/create", async (request) => {
    const input = validateCreationBody(request.body);

    return createExplicitTestPlansCases(input, client);
  });
}

function validateCreationBody(body: TestPlansCreationBody | undefined): TestPlansCreationRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  if (containsSensitiveKey(body)) {
    throw badRequest("Request body must not include secrets or tokens.");
  }

  const readinessResult = validateReadinessResult(body.readinessResult);
  const selectedCandidateIds = validateSelectedCandidateIds(body.selectedCandidateIds);
  const confirmation = validateConfirmation(body.confirmation);
  validateSelectedCandidatesExist(readinessResult, selectedCandidateIds);

  return {
    readinessResult,
    selectedCandidateIds,
    confirmation
  };
}

function validateReadinessResult(value: unknown): TestPlansReadinessResult {
  if (!isObject(value)) {
    throw badRequest("readinessResult is required.");
  }

  if (value.status !== "ready-for-confirmation") {
    throw badRequest("readinessResult.status must be ready-for-confirmation.");
  }

  if (!isObject(value.target)) {
    throw badRequest("readinessResult.target is required.");
  }

  const target = value.target;

  for (const field of ["organization", "project", "team"] as const) {
    if (!isNonEmptyString(target[field])) {
      throw badRequest(`readinessResult.target.${field} is required.`);
    }
  }

  if (!isPresentStringOrNumber(target.testPlanId)) {
    throw badRequest("readinessResult.target.testPlanId is required.");
  }

  if (!isPresentStringOrNumber(target.testSuiteId)) {
    throw badRequest("readinessResult.target.testSuiteId is required.");
  }

  if (!Array.isArray(value.candidates)) {
    throw badRequest("readinessResult.candidates must be an array.");
  }

  const organization = String(target.organization).trim();
  const project = String(target.project).trim();
  const team = String(target.team).trim();
  const testPlanId = normalizeStringOrNumber(target.testPlanId);
  const testSuiteId = normalizeStringOrNumber(target.testSuiteId);

  return {
    ...value,
    target: {
      ...target,
      organization,
      project,
      team,
      testPlanId,
      testSuiteId
    }
  } as TestPlansReadinessResult;
}

function validateSelectedCandidateIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw badRequest("selectedCandidateIds must be a non-empty array.");
  }

  const selectedCandidateIds = value.filter(isNonEmptyString).map((id) => id.trim());

  if (selectedCandidateIds.length !== value.length || selectedCandidateIds.length === 0) {
    throw badRequest("selectedCandidateIds must be a non-empty array of strings.");
  }

  return Array.from(new Set(selectedCandidateIds));
}

function validateConfirmation(value: unknown): TestPlansCreationConfirmation {
  if (!isObject(value)) {
    throw badRequest("confirmation is required.");
  }

  if (value.confirmedByUser !== true) {
    throw badRequest("confirmation.confirmedByUser must be true.");
  }

  return {
    confirmedByUser: true,
    confirmationText: isNonEmptyString(value.confirmationText) ? value.confirmationText.trim() : undefined,
    confirmedAt: isNonEmptyString(value.confirmedAt) ? value.confirmedAt.trim() : undefined
  };
}

function validateSelectedCandidatesExist(readinessResult: TestPlansReadinessResult, selectedCandidateIds: string[]): void {
  const candidateIds = new Set(readinessResult.candidates.flatMap((candidate) => [
    candidate.reviewedCaseId,
    candidate.originalDraftId
  ]));

  for (const selectedId of selectedCandidateIds) {
    if (!candidateIds.has(selectedId)) {
      throw badRequest("selectedCandidateIds must reference readinessResult candidates.");
    }
  }
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

function isPresentStringOrNumber(value: unknown): value is string | number {
  return isNonEmptyString(value) || (typeof value === "number" && Number.isFinite(value));
}

function normalizeStringOrNumber(value: string | number): string | number {
  return typeof value === "string" ? value.trim() : value;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

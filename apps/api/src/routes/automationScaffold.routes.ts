import type { FastifyInstance } from "fastify";
import type {
  AutomationCandidateMappingResult,
  AutomationScaffoldOptions,
  AutomationScaffoldRequest
} from "@qa-assist/shared";
import { buildAutomationScaffoldPreview } from "../automation/automationScaffold.service.js";

type AutomationScaffoldBody = {
  automationMappingResult?: unknown;
  selectedCandidateIds?: unknown;
  scaffoldOptions?: unknown;
};

export async function registerAutomationScaffoldRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: AutomationScaffoldBody }>("/automation/scaffold/preview", async (request) => {
    const input = validateAutomationScaffoldBody(request.body);

    return buildAutomationScaffoldPreview(input);
  });
}

function validateAutomationScaffoldBody(body: AutomationScaffoldBody | undefined): AutomationScaffoldRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  const automationMappingResult = validateAutomationMappingResult(body.automationMappingResult);
  const selectedCandidateIds = validateSelectedCandidateIds(body.selectedCandidateIds);
  const availableIds = new Set(automationMappingResult.candidates.map((candidate) => candidate.reviewedCaseId));

  for (const candidateId of selectedCandidateIds) {
    if (!availableIds.has(candidateId)) {
      throw badRequest(`selectedCandidateIds contains unknown candidate id: ${candidateId}.`);
    }
  }

  return {
    automationMappingResult,
    selectedCandidateIds,
    scaffoldOptions: validateScaffoldOptions(body.scaffoldOptions)
  };
}

function validateAutomationMappingResult(value: unknown): AutomationCandidateMappingResult {
  if (!isObject(value)) {
    throw badRequest("automationMappingResult is required.");
  }

  const workItemId = Number(value.workItemId);
  if (!Number.isSafeInteger(workItemId) || workItemId <= 0) {
    throw badRequest("automationMappingResult.workItemId must be a positive integer.");
  }

  if (!isNonEmptyString(value.workItemTitle)) {
    throw badRequest("automationMappingResult.workItemTitle is required.");
  }

  if (!Array.isArray(value.candidates)) {
    throw badRequest("automationMappingResult.candidates must be an array.");
  }

  return value as AutomationCandidateMappingResult;
}

function validateSelectedCandidateIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw badRequest("selectedCandidateIds must be an array.");
  }

  const candidateIds = value.filter(isNonEmptyString).map((item) => item.trim());
  if (candidateIds.length === 0) {
    throw badRequest("selectedCandidateIds must include at least one candidate id.");
  }

  return Array.from(new Set(candidateIds));
}

function validateScaffoldOptions(value: unknown): AutomationScaffoldOptions | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isObject(value)) {
    throw badRequest("scaffoldOptions must be an object.");
  }

  const options: AutomationScaffoldOptions = {};

  for (const key of ["includeSelectors", "includeTestDataNotes", "includeApiClientShape"] as const) {
    if (value[key] !== undefined && typeof value[key] !== "boolean") {
      throw badRequest(`scaffoldOptions.${key} must be a boolean.`);
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

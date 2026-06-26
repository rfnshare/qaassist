import type { FastifyInstance } from "fastify";
import type {
  StoryRequirementAnalysis,
  TestCaseDraftGenerationRequest,
  TestCaseDraftSelectedInputs,
  WorkItemDetail
} from "@qa-assist/shared";
import { generateDeterministicTestCaseDrafts } from "../test-cases/testCaseDraft.service.js";

type TestCaseDraftBody = {
  workItem?: unknown;
  analysis?: unknown;
  selectedDraftInputs?: unknown;
};

export async function registerTestCaseDraftRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: TestCaseDraftBody }>("/test-cases/drafts/generate", async (request) => {
    const generationRequest = validateTestCaseDraftBody(request.body);

    return generateDeterministicTestCaseDrafts(generationRequest);
  });
}

function validateTestCaseDraftBody(body: TestCaseDraftBody | undefined): TestCaseDraftGenerationRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  const workItem = validateWorkItem(body.workItem);
  const analysis = validateAnalysis(body.analysis, workItem.workItemId);

  return {
    workItem,
    analysis,
    selectedDraftInputs: validateSelectedDraftInputs(body.selectedDraftInputs)
  };
}

function validateWorkItem(value: unknown): WorkItemDetail {
  if (!isObject(value)) {
    throw badRequest("workItem is required.");
  }

  const workItemId = Number(value.workItemId);

  if (!Number.isSafeInteger(workItemId) || workItemId <= 0) {
    throw badRequest("workItem.workItemId must be a positive integer.");
  }

  if (!isNonEmptyString(value.title)) {
    throw badRequest("workItem.title is required.");
  }

  if (!isNonEmptyString(value.workItemType)) {
    throw badRequest("workItem.workItemType is required.");
  }

  return {
    ...value,
    workItemId,
    title: value.title.trim(),
    workItemType: value.workItemType
  } as WorkItemDetail;
}

function validateAnalysis(value: unknown, workItemId: number): StoryRequirementAnalysis {
  if (!isObject(value)) {
    throw badRequest("analysis is required.");
  }

  if (value.workItemId !== workItemId) {
    throw badRequest("analysis.workItemId must match workItem.workItemId.");
  }

  if (value.mode !== "deterministic-preview") {
    throw badRequest("analysis.mode must be deterministic-preview.");
  }

  if (!Array.isArray(value.gaps)) {
    throw badRequest("analysis.gaps must be an array.");
  }

  if (!Array.isArray(value.questionsForBAOrPO)) {
    throw badRequest("analysis.questionsForBAOrPO must be an array.");
  }

  if (!Array.isArray(value.likelyTestAreas)) {
    throw badRequest("analysis.likelyTestAreas must be an array.");
  }

  return {
    ...value,
    gaps: value.gaps,
    questionsForBAOrPO: value.questionsForBAOrPO,
    likelyTestAreas: value.likelyTestAreas,
    risks: Array.isArray(value.risks) ? value.risks : [],
    assumptions: Array.isArray(value.assumptions) ? value.assumptions : [],
    needsConfirmation: Array.isArray(value.needsConfirmation) ? value.needsConfirmation : [],
    evidence: Array.isArray(value.evidence) ? value.evidence : [],
    linkedKnowledgeEvidence: Array.isArray(value.linkedKnowledgeEvidence) ? value.linkedKnowledgeEvidence : []
  } as StoryRequirementAnalysis;
}

function validateSelectedDraftInputs(value: unknown): TestCaseDraftSelectedInputs | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isObject(value)) {
    throw badRequest("selectedDraftInputs must be an object.");
  }

  const normalized: TestCaseDraftSelectedInputs = {};

  for (const key of ["includePositivePath", "includeNegativePath", "includeRegression", "includeLinkedKnowledge", "includeUserConfirmedNotes"] as const) {
    if (value[key] !== undefined && typeof value[key] !== "boolean") {
      throw badRequest(`selectedDraftInputs.${key} must be a boolean.`);
    }

    if (typeof value[key] === "boolean") {
      normalized[key] = value[key];
    }
  }

  return normalized;
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

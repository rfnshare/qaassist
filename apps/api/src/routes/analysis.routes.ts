import type { FastifyInstance } from "fastify";
import type { WorkItemDetail } from "@qa-assist/shared";
import { generateDeterministicStoryRequirementAnalysis } from "../analysis/storyRequirementAnalysis.service.js";

type StoryRequirementAnalysisBody = {
  workItem?: unknown;
};

export async function registerAnalysisRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: StoryRequirementAnalysisBody }>("/analysis/story-requirements", async (request) => {
    const workItem = validateStoryRequirementAnalysisBody(request.body);

    return generateDeterministicStoryRequirementAnalysis(workItem);
  });
}

function validateStoryRequirementAnalysisBody(body: StoryRequirementAnalysisBody | undefined): WorkItemDetail {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  if (!body.workItem || typeof body.workItem !== "object") {
    throw badRequest("workItem is required.");
  }

  const workItem = body.workItem as Partial<WorkItemDetail>;

  if (!Number.isSafeInteger(workItem.workItemId) || !workItem.workItemId || workItem.workItemId <= 0) {
    throw badRequest("workItem.workItemId must be a positive integer.");
  }

  if (!isNonEmptyString(workItem.title)) {
    throw badRequest("workItem.title is required.");
  }

  if (!isNonEmptyString(workItem.workItemType)) {
    throw badRequest("workItem.workItemType is required.");
  }

  if (!isNonEmptyString(workItem.organization)) {
    throw badRequest("workItem.organization is required.");
  }

  if (!isNonEmptyString(workItem.project)) {
    throw badRequest("workItem.project is required.");
  }

  if (!isNonEmptyString(workItem.url)) {
    throw badRequest("workItem.url is required.");
  }

  if (!workItem.evidence || typeof workItem.evidence !== "object") {
    throw badRequest("workItem.evidence is required.");
  }

  if (!isNonEmptyString(workItem.evidence.fetchedAt)) {
    throw badRequest("workItem.evidence.fetchedAt is required.");
  }

  if (!isNonEmptyString(workItem.evidence.sourceDescription)) {
    throw badRequest("workItem.evidence.sourceDescription is required.");
  }

  if (!Array.isArray(workItem.tags)) {
    throw badRequest("workItem.tags must be an array.");
  }

  if (!Array.isArray(workItem.relations)) {
    throw badRequest("workItem.relations must be an array.");
  }

  return {
    ...workItem,
    source: "azure-devops",
    organization: workItem.organization.trim(),
    project: workItem.project.trim(),
    workItemId: workItem.workItemId,
    url: workItem.url.trim(),
    workItemType: workItem.workItemType,
    title: workItem.title.trim(),
    descriptionText: normalizeOptionalString(workItem.descriptionText),
    acceptanceCriteriaText: normalizeOptionalString(workItem.acceptanceCriteriaText),
    tags: workItem.tags.filter(isNonEmptyString).map((tag) => tag.trim()),
    relations: workItem.relations,
    evidence: {
      ...workItem.evidence,
      fetchedAt: workItem.evidence.fetchedAt.trim(),
      sourceDescription: workItem.evidence.sourceDescription.trim()
    },
    workspace: workItem.workspace ?? {
      activeSections: [],
      placeholders: {
        requirementSummaryStatus: "not-started",
        gapsStatus: "not-started",
        testScopeStatus: "not-started",
        message: "Analysis requested from partial work item payload."
      }
    }
  } as WorkItemDetail;
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

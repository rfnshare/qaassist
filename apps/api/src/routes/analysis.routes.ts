import type { FastifyInstance } from "fastify";
import type {
  StoryLinkedKnowledgeEvidence,
  StoryLinkedKnowledgeEvidenceKind,
  StoryRequirementAnalysisCertainty,
  StoryRequirementAnalysisRequest,
  WorkItemDetail
} from "@qa-assist/shared";
import { generateDeterministicStoryRequirementAnalysis } from "../analysis/storyRequirementAnalysis.service.js";

type StoryRequirementAnalysisBody = {
  workItem?: unknown;
  linkedKnowledgeEvidence?: unknown;
};

const LINKED_EVIDENCE_KINDS: StoryLinkedKnowledgeEvidenceKind[] = [
  "board-knowledge-metadata",
  "extracted-text-preview",
  "user-confirmed-note"
];

const LINKED_EVIDENCE_CERTAINTIES: StoryRequirementAnalysisCertainty[] = [
  "source-backed",
  "user-confirmed",
  "assumption",
  "needs-confirmation"
];

const LINKED_EVIDENCE_PREVIEW_MAX_LENGTH = 1500;

export async function registerAnalysisRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: StoryRequirementAnalysisBody }>("/analysis/story-requirements", async (request) => {
    const analysisRequest = validateStoryRequirementAnalysisBody(request.body);

    return generateDeterministicStoryRequirementAnalysis(
      analysisRequest.workItem,
      analysisRequest.linkedKnowledgeEvidence ?? []
    );
  });
}

function validateStoryRequirementAnalysisBody(body: StoryRequirementAnalysisBody | undefined): StoryRequirementAnalysisRequest {
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

  const normalizedWorkItem = {
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

  return {
    workItem: normalizedWorkItem,
    linkedKnowledgeEvidence: validateLinkedKnowledgeEvidence(body.linkedKnowledgeEvidence)
  };
}

function validateLinkedKnowledgeEvidence(value: unknown): StoryLinkedKnowledgeEvidence[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw badRequest("linkedKnowledgeEvidence must be an array.");
  }

  return value.map((item, index) => validateLinkedKnowledgeEvidenceItem(item, index));
}

function validateLinkedKnowledgeEvidenceItem(value: unknown, index: number): StoryLinkedKnowledgeEvidence {
  if (!value || typeof value !== "object") {
    throw badRequest(`linkedKnowledgeEvidence[${index}] must be an object.`);
  }

  const item = value as Partial<StoryLinkedKnowledgeEvidence>;

  if (!isNonEmptyString(item.id)) {
    throw badRequest(`linkedKnowledgeEvidence[${index}].id is required.`);
  }

  if (!LINKED_EVIDENCE_KINDS.includes(item.kind as StoryLinkedKnowledgeEvidenceKind)) {
    throw badRequest(`linkedKnowledgeEvidence[${index}].kind is invalid.`);
  }

  if (!isNonEmptyString(item.title)) {
    throw badRequest(`linkedKnowledgeEvidence[${index}].title is required.`);
  }

  if (!isNonEmptyString(item.evidenceLabel)) {
    throw badRequest(`linkedKnowledgeEvidence[${index}].evidenceLabel is required.`);
  }

  if (item.selectedByUser !== true) {
    throw badRequest(`linkedKnowledgeEvidence[${index}].selectedByUser must be true.`);
  }

  if (item.limitations !== undefined && !Array.isArray(item.limitations)) {
    throw badRequest(`linkedKnowledgeEvidence[${index}].limitations must be an array.`);
  }

  if (item.certainty !== undefined && !LINKED_EVIDENCE_CERTAINTIES.includes(item.certainty as StoryRequirementAnalysisCertainty)) {
    throw badRequest(`linkedKnowledgeEvidence[${index}].certainty is invalid.`);
  }

  return {
    id: item.id.trim(),
    kind: item.kind as StoryLinkedKnowledgeEvidenceKind,
    title: item.title.trim(),
    sourceType: item.sourceType,
    status: item.status,
    trustLevel: item.trustLevel,
    textPreview: normalizeOptionalString(item.textPreview)?.slice(0, LINKED_EVIDENCE_PREVIEW_MAX_LENGTH),
    fileName: normalizeOptionalString(item.fileName),
    evidenceLabel: item.evidenceLabel.trim(),
    selectedByUser: true,
    limitations: (item.limitations ?? []).filter(isNonEmptyString).map((limitation) => limitation.trim()),
    certainty: item.certainty ?? "needs-confirmation"
  };
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

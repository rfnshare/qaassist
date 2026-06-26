import type { FastifyInstance } from "fastify";
import type {
  BoardKnowledgeSource,
  BoardKnowledgeSourceStatus,
  BoardKnowledgeSourceType,
  BoardKnowledgeSummary,
  BoardKnowledgeUploadDraft,
  BoardScope,
  KnowledgeExtractionRequest
} from "@qa-assist/shared";
import { extractKnowledgeText } from "../knowledge/knowledgeExtraction.service.js";

const SOURCE_TYPES: BoardKnowledgeSourceType[] = [
  "requirement-document",
  "meeting-transcript",
  "ba-po-qa",
  "product-rule",
  "release-note",
  "test-note",
  "known-risk",
  "automation-reference",
  "other"
];

type ValidateKnowledgeSourceBody = {
  selectedBoard?: unknown;
  source?: unknown;
};

type KnowledgeSummaryBody = {
  selectedBoard?: unknown;
  sources?: unknown;
};

type KnowledgeExtractionBody = {
  selectedBoard?: unknown;
  source?: unknown;
  file?: unknown;
};

export async function registerKnowledgeRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ValidateKnowledgeSourceBody }>("/knowledge/board/sources/validate", async (request) => {
    const selectedBoard = validateSelectedBoard(request.body?.selectedBoard);
    const source = validateSourceDraft(request.body?.source);
    const addedAt = new Date().toISOString();

    return {
      source: normalizeKnowledgeSource(selectedBoard, source, addedAt)
    };
  });

  app.post<{ Body: KnowledgeSummaryBody }>("/knowledge/board/summary", async (request) => {
    const selectedBoard = validateSelectedBoard(request.body?.selectedBoard);

    if (!Array.isArray(request.body?.sources)) {
      throw badRequest("sources must be an array.");
    }

    const sources = request.body.sources.filter(isObject) as Partial<BoardKnowledgeSource>[];

    return {
      summary: buildSummary(selectedBoard, sources)
    };
  });

  app.post<{ Body: KnowledgeExtractionBody }>("/knowledge/board/sources/extract-text", async (request) => {
    const extractionRequest = validateKnowledgeExtractionRequest(request.body);

    return extractKnowledgeText(extractionRequest);
  });
}

function validateSelectedBoard(value: unknown): BoardScope {
  if (!isObject(value)) {
    throw badRequest("selectedBoard is required.");
  }

  if (value.source !== "azure-devops") {
    throw badRequest("selectedBoard.source must be azure-devops.");
  }

  if (!isNonEmptyString(value.organization)) {
    throw badRequest("selectedBoard.organization is required.");
  }

  if (!isNonEmptyString(value.project)) {
    throw badRequest("selectedBoard.project is required.");
  }

  if (!isNonEmptyString(value.team)) {
    throw badRequest("selectedBoard.team is required.");
  }

  return {
    ...value,
    source: "azure-devops",
    organization: value.organization.trim(),
    project: value.project.trim(),
    team: value.team.trim(),
    board: normalizeOptionalString(value.board),
    iterationPath: normalizeOptionalString(value.iterationPath)
  } as BoardScope;
}

function validateSourceDraft(value: unknown): BoardKnowledgeUploadDraft {
  if (!isObject(value)) {
    throw badRequest("source is required.");
  }

  if (!isSourceType(value.type)) {
    throw badRequest("source.type is invalid.");
  }

  if (!isNonEmptyString(value.title)) {
    throw badRequest("source.title is required.");
  }

  const file = value.file !== undefined ? validateFileMetadata(value.file) : undefined;

  return {
    type: value.type,
    title: value.title.trim(),
    description: normalizeOptionalString(value.description),
    file,
    tags: Array.isArray(value.tags) ? value.tags.filter(isNonEmptyString).map((tag) => tag.trim()) : [],
    privacyNote: normalizeOptionalString(value.privacyNote),
    limitations: Array.isArray(value.limitations) ? value.limitations.filter(isNonEmptyString).map((item) => item.trim()) : [],
    addedBy: normalizeOptionalString(value.addedBy)
  };
}

function validateFileMetadata(value: unknown): BoardKnowledgeUploadDraft["file"] {
  if (!isObject(value)) {
    throw badRequest("source.file must be an object.");
  }

  if (!isNonEmptyString(value.fileName)) {
    throw badRequest("source.file.fileName is required.");
  }

  if (value.sizeBytes !== undefined && (typeof value.sizeBytes !== "number" || !Number.isFinite(value.sizeBytes) || value.sizeBytes < 0)) {
    throw badRequest("source.file.sizeBytes must be a non-negative number.");
  }

  return {
    fileName: value.fileName.trim(),
    fileType: normalizeOptionalString(value.fileType),
    sizeBytes: normalizeOptionalNumber(value.sizeBytes),
    addedBy: normalizeOptionalString(value.addedBy)
  };
}

function validateKnowledgeExtractionRequest(body: KnowledgeExtractionBody | undefined): KnowledgeExtractionRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  return {
    selectedBoard: validateSelectedBoard(body.selectedBoard),
    source: validateExtractionSource(body.source),
    file: validateExtractionFile(body.file)
  };
}

function validateExtractionSource(value: unknown): KnowledgeExtractionRequest["source"] {
  if (!isObject(value)) {
    throw badRequest("source is required.");
  }

  if (!isNonEmptyString(value.title)) {
    throw badRequest("source.title is required.");
  }

  if (value.type !== undefined && !isSourceType(value.type)) {
    throw badRequest("source.type is invalid.");
  }

  return {
    id: normalizeOptionalString(value.id),
    title: value.title.trim(),
    type: value.type
  };
}

function validateExtractionFile(value: unknown): KnowledgeExtractionRequest["file"] {
  if (!isObject(value)) {
    throw badRequest("file is required.");
  }

  if (!isNonEmptyString(value.fileName)) {
    throw badRequest("file.fileName is required.");
  }

  if (!isNonEmptyString(value.textContent)) {
    throw badRequest("file.textContent is required.");
  }

  if (value.sizeBytes !== undefined && (typeof value.sizeBytes !== "number" || !Number.isFinite(value.sizeBytes) || value.sizeBytes < 0)) {
    throw badRequest("file.sizeBytes must be a non-negative number.");
  }

  return {
    fileName: value.fileName.trim(),
    fileType: normalizeOptionalString(value.fileType),
    sizeBytes: normalizeOptionalNumber(value.sizeBytes),
    textContent: value.textContent
  };
}

function normalizeKnowledgeSource(
  selectedBoard: BoardScope,
  source: BoardKnowledgeUploadDraft,
  addedAt: string
): BoardKnowledgeSource {
  return {
    id: `metadata-${Date.now()}`,
    selectedBoard,
    scope: {
      organization: selectedBoard.organization,
      project: selectedBoard.project,
      team: selectedBoard.team ?? "",
      board: selectedBoard.board,
      iteration: selectedBoard.iterationPath
    },
    type: source.type,
    status: "metadata-only",
    trustLevel: "needs-confirmation",
    title: source.title,
    description: source.description,
    file: source.file
      ? {
          ...source.file,
          addedAt
        }
      : undefined,
    tags: source.tags ?? [],
    privacyNote: source.privacyNote ?? "Metadata only. File content is not uploaded, parsed, indexed, or analyzed in this step.",
    limitations: [
      "Content upload and indexing are not active yet.",
      "This source is not included in Story analysis or board briefing yet.",
      ...(source.limitations ?? [])
    ],
    evidenceLabel: `Metadata-only ${source.type} source for ${selectedBoard.organization}/${selectedBoard.project}/${selectedBoard.team}. Content not indexed.`,
    addedAt,
    addedBy: source.addedBy
  };
}

function buildSummary(selectedBoard: BoardScope, sources: Partial<BoardKnowledgeSource>[]): BoardKnowledgeSummary {
  const countByType: Partial<Record<BoardKnowledgeSourceType, number>> = {};
  const countByStatus: Partial<Record<BoardKnowledgeSourceStatus, number>> = {};

  for (const source of sources) {
    if (isSourceType(source.type)) {
      countByType[source.type] = (countByType[source.type] ?? 0) + 1;
    }

    if (isSourceStatus(source.status)) {
      countByStatus[source.status] = (countByStatus[source.status] ?? 0) + 1;
    }
  }

  return {
    selectedBoard,
    generatedAt: new Date().toISOString(),
    totalSources: sources.length,
    countByType,
    countByStatus,
    warnings: [
      "Metadata summary only. Source content is not uploaded, parsed, indexed, or analyzed yet.",
      ...(sources.length === 0 ? ["No board knowledge metadata sources are configured for this board."] : [])
    ]
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

function normalizeOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isSourceType(value: unknown): value is BoardKnowledgeSourceType {
  return typeof value === "string" && SOURCE_TYPES.includes(value as BoardKnowledgeSourceType);
}

function isSourceStatus(value: unknown): value is BoardKnowledgeSourceStatus {
  return typeof value === "string"
    && ["draft", "metadata-only", "uploaded", "indexed", "disabled", "error"].includes(value);
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

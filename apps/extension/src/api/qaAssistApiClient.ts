import type {
  AzureDevOpsConnectionInfo,
  AzureDevOpsProjectOption,
  AzureDevOpsTeamOption,
  BoardBriefing,
  BoardKnowledgeSource,
  BoardKnowledgeSummary,
  BoardKnowledgeUploadDraft,
  BoardScope,
  CurrentQaUserSettings,
  KnowledgeExtractionRequest,
  KnowledgeExtractionResult,
  QaWorkQueue,
  BoardSummary,
  StoryRequirementAnalysis,
  StoryRequirementAnalysisRequest,
  WorkItemDetail,
  WorkRecommendation
} from "@qa-assist/shared";

export type BoardSummaryPreviewResponse = {
  boardSummary: BoardSummary;
  workQueue: QaWorkQueue;
  recommendation?: WorkRecommendation;
};

export async function connectAzureDevOps(
  apiBaseUrl: string,
  url: string
): Promise<{ connection: AzureDevOpsConnectionInfo; projects: AzureDevOpsProjectOption[] }> {
  return postJson(apiBaseUrl, "/azure-devops/setup/connect", { url });
}

export async function listAzureProjects(
  apiBaseUrl: string,
  connection: AzureDevOpsConnectionInfo
): Promise<{ projects: AzureDevOpsProjectOption[] }> {
  return postJson(apiBaseUrl, "/azure-devops/setup/projects", { connection });
}

export async function listAzureTeams(
  apiBaseUrl: string,
  connection: AzureDevOpsConnectionInfo,
  project: string
): Promise<{ teams: AzureDevOpsTeamOption[] }> {
  return postJson(apiBaseUrl, "/azure-devops/setup/teams", { connection, project });
}

export async function fetchBoardSummaryPreview(
  apiBaseUrl: string,
  input: {
    selectedBoard: BoardScope;
    currentQaUser?: CurrentQaUserSettings;
    maxItems?: number;
  }
): Promise<BoardSummaryPreviewResponse> {
  return postJson(apiBaseUrl, "/azure-devops/board-summary/preview", input);
}

export async function fetchWorkItemDetail(
  apiBaseUrl: string,
  input: {
    organization: string;
    project: string;
    workItemId: number;
    team?: string;
    url?: string;
  }
): Promise<{ workItem: WorkItemDetail; fetchedAt: string }> {
  return postJson(apiBaseUrl, "/azure-devops/work-items/detail", input);
}

export async function analyzeStoryRequirements(
  apiBaseUrl: string,
  input: WorkItemDetail | StoryRequirementAnalysisRequest
): Promise<StoryRequirementAnalysis> {
  return postJson(apiBaseUrl, "/analysis/story-requirements", "workItem" in input ? input : { workItem: input });
}

export async function validateBoardKnowledgeSource(
  apiBaseUrl: string,
  input: {
    selectedBoard: BoardScope;
    source: BoardKnowledgeUploadDraft;
  }
): Promise<{ source: BoardKnowledgeSource }> {
  return postJson(apiBaseUrl, "/knowledge/board/sources/validate", input);
}

export async function summarizeBoardKnowledge(
  apiBaseUrl: string,
  input: {
    selectedBoard: BoardScope;
    sources: BoardKnowledgeSource[];
  }
): Promise<{ summary: BoardKnowledgeSummary }> {
  return postJson(apiBaseUrl, "/knowledge/board/summary", input);
}

export async function extractBoardKnowledgeText(
  apiBaseUrl: string,
  input: KnowledgeExtractionRequest
): Promise<KnowledgeExtractionResult> {
  return postJson(apiBaseUrl, "/knowledge/board/sources/extract-text", input);
}

export async function generateBoardBriefing(
  apiBaseUrl: string,
  input: {
    boardSummary: BoardSummary;
    workQueue: QaWorkQueue;
    recommendation?: WorkRecommendation;
    currentQaUser?: CurrentQaUserSettings;
  }
): Promise<BoardBriefing> {
  return postJson(apiBaseUrl, "/briefings/board", input);
}

async function postJson<T>(apiBaseUrl: string, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as T | { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload));
  }

  return payload as T;
}

function getApiErrorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return "QA Assist API request failed.";
}

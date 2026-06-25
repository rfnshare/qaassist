import type {
  AzureDevOpsConnectionInfo,
  AzureDevOpsProjectOption,
  AzureDevOpsTeamOption,
  BoardBriefing,
  BoardScope,
  CurrentQaUserSettings,
  QaWorkQueue,
  BoardSummary,
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

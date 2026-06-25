import type {
  AzureDevOpsStateMapping,
  AzureDevOpsStateOption,
  BoardSummary,
  BoardScope,
  CurrentQaUserSettings,
  QaWorkItemSummary,
  QaWorkQueue,
  QaWorkflowStateCategory,
  WorkRecommendation
} from "@qa-assist/shared";
import type { AzureDevOpsClient } from "./azureDevOpsClient.js";
import { createStateBucket, mapAzureWorkItem } from "./azureDevOpsMappers.js";

const DEFAULT_MAX_ITEMS = 100;
const MAX_ITEMS_CAP = 200;

type WorkItemReference = {
  id: number;
};

type WiqlResponse = {
  workItems?: WorkItemReference[];
};

type WorkItemsBatchResponse = {
  value?: AzureWorkItem[];
};

type AzureWorkItem = {
  id: number;
  url?: string;
  fields: Record<string, unknown>;
};

export type BoardSummaryPreviewInput = {
  selectedBoard: BoardScope;
  currentQaUser?: CurrentQaUserSettings;
  stateMapping?: AzureDevOpsStateMapping[];
  stateOptions?: AzureDevOpsStateOption[];
  maxItems?: number;
};

export type BoardSummaryPreviewResult = {
  boardSummary: BoardSummary;
  workQueue: QaWorkQueue;
  recommendation?: WorkRecommendation;
  stateOptions?: AzureDevOpsStateOption[];
};

export async function fetchAzureDevOpsBoardSummaryPreview(
  client: AzureDevOpsClient,
  input: BoardSummaryPreviewInput
): Promise<BoardSummaryPreviewResult> {
  const maxItems = normalizeMaxItems(input.maxItems);
  const ids = await fetchCandidateIds(client, input.selectedBoard, maxItems);
  const items = ids.length > 0 ? await fetchWorkItems(client, input.selectedBoard, ids) : [];
  const summaries = items.map((item) =>
    mapAzureWorkItem(item, {
      organization: input.selectedBoard.organization,
      project: input.selectedBoard.project,
      qaCategory: mapStateToCategory(String(item.fields["System.State"] ?? ""), input.stateMapping)
    })
  );

  const myWork = filterMyWork(summaries, input.currentQaUser);
  const resolvedBugsReadyToRetest = summaries.filter(
    (item) => item.type === "bug" && (item.qaCategory === "resolved" || item.qaCategory === "ready-to-test")
  );
  const workQueue = buildWorkQueue(input.selectedBoard, summaries, myWork, resolvedBugsReadyToRetest);
  const boardSummary = buildBoardSummary(input.selectedBoard, summaries, myWork, resolvedBugsReadyToRetest);
  const recommendation = buildRecommendation(summaries);

  return {
    boardSummary,
    workQueue,
    recommendation,
    stateOptions: input.stateOptions
  };
}

async function fetchCandidateIds(client: AzureDevOpsClient, board: BoardScope, maxItems: number): Promise<number[]> {
  const response = await client.request<WiqlResponse>({
    organization: board.organization,
    project: board.project,
    path: "wit/wiql",
    method: "POST",
    body: {
      query: buildWiql(board)
    }
  });

  return (response.workItems ?? []).slice(0, maxItems).map((item) => item.id);
}

async function fetchWorkItems(
  client: AzureDevOpsClient,
  board: BoardScope,
  ids: number[]
): Promise<AzureWorkItem[]> {
  const response = await client.request<WorkItemsBatchResponse>({
    organization: board.organization,
    project: board.project,
    path: "wit/workitemsbatch",
    method: "POST",
    body: {
      ids,
      fields: [
        "System.Id",
        "System.Title",
        "System.WorkItemType",
        "System.State",
        "System.AssignedTo",
        "System.Tags",
        "System.CreatedDate",
        "System.ChangedDate",
        "Microsoft.VSTS.Common.Priority",
        "Microsoft.VSTS.Common.Severity",
        "Microsoft.VSTS.Scheduling.StoryPoints"
      ]
    }
  });

  return response.value ?? [];
}

function buildWiql(board: BoardScope): string {
  const clauses = [
    "[System.TeamProject] = @project",
    "[System.WorkItemType] IN ('User Story', 'Product Backlog Item', 'Bug', 'Task')"
  ];

  if (board.iterationPath) {
    clauses.push(`[System.IterationPath] UNDER '${escapeWiqlLiteral(board.iterationPath)}'`);
  }

  return `
    SELECT [System.Id]
    FROM WorkItems
    WHERE ${clauses.join(" AND ")}
    ORDER BY [System.ChangedDate] DESC
  `;
}

function buildWorkQueue(
  boardScope: BoardScope,
  items: QaWorkItemSummary[],
  myWork: QaWorkItemSummary[],
  resolvedBugsReadyToRetest: QaWorkItemSummary[]
): QaWorkQueue {
  return {
    boardScope,
    generatedAt: new Date().toISOString(),
    buckets: [
      { id: "my-work", label: "My work", items: myWork, sourceDescription: "Matched by configured QA user." },
      {
        id: "ready-to-retest",
        label: "Resolved bugs ready to retest",
        qaCategory: "resolved",
        items: resolvedBugsReadyToRetest,
        sourceDescription: "Bugs mapped to resolved or ready-to-test categories."
      },
      { id: "recent-work", label: "Recent work", items, sourceDescription: "Recent Azure DevOps work items from WIQL." }
    ],
    myWork,
    resolvedBugsReadyToRetest,
    suggestedNextWork: items[0],
    dataFreshness: "Fetched live from Azure DevOps for this preview request."
  };
}

function buildBoardSummary(
  selectedBoard: BoardScope,
  items: QaWorkItemSummary[],
  myWork: QaWorkItemSummary[],
  resolvedBugsReadyToRetest: QaWorkItemSummary[]
): BoardSummary {
  return {
    selectedBoard,
    generatedAt: new Date().toISOString(),
    connectionStatus: "connected",
    metrics: [
      { id: "candidate-items", label: "Candidate work items", value: items.length, sourceDescription: "WIQL result count." },
      { id: "my-work", label: "My QA work", value: myWork.length, sourceDescription: "Matched configured QA user." },
      {
        id: "ready-to-retest",
        label: "Resolved bugs ready to retest",
        value: resolvedBugsReadyToRetest.length,
        sourceDescription: "Mapped from returned bug states."
      }
    ],
    stateBuckets: {
      inQA: createStateBucket("in-qa", "In QA", filterByCategory(items, "in-qa")),
      readyToTest: createStateBucket("ready-to-test", "Ready to Test", filterByCategory(items, "ready-to-test")),
      resolved: createStateBucket("resolved", "Resolved", filterByCategory(items, "resolved")),
      blocked: createStateBucket("blocked", "Blocked", filterByCategory(items, "blocked")),
      readyForUat: createStateBucket("ready-for-uat", "Ready for UAT", filterByCategory(items, "ready-for-uat"))
    },
    myWork,
    resolvedBugsReadyToRetest,
    openRisks: items.filter((item) => item.isBlocked).map((item) => `${item.workItemId}: ${item.title}`),
    dataFreshness: "Fetched live from Azure DevOps for this preview request.",
    sourceDescription: "Azure DevOps WIQL and work items batch preview."
  };
}

function buildRecommendation(items: QaWorkItemSummary[]): WorkRecommendation | undefined {
  const recommendedWorkItem = items.find((item) => item.isBlocked !== true) ?? items[0];

  if (!recommendedWorkItem) {
    return undefined;
  }

  return {
    recommendedWorkItem,
    decision: "suggested-next",
    priority: "medium",
    rank: 1,
    reason: "Suggested from recent Azure DevOps work using available priority, state, age, assignment, and blocked signals.",
    signals: recommendedWorkItem.signals ?? [],
    confidence: 0.45,
    assumptions: ["This preview uses simple explainable ordering, not final prioritization logic."],
    needsUserConfirmation: true,
    generatedAt: new Date().toISOString()
  };
}

function filterMyWork(items: QaWorkItemSummary[], currentQaUser: CurrentQaUserSettings | undefined): QaWorkItemSummary[] {
  if (!currentQaUser?.displayName && !currentQaUser?.email) {
    return [];
  }

  const displayName = currentQaUser.displayName.toLowerCase();
  const email = currentQaUser.email?.toLowerCase();

  return items.filter((item) => {
    const assignedTo = item.assignedTo?.toLowerCase();
    return assignedTo ? assignedTo.includes(displayName) || (email ? assignedTo.includes(email) : false) : false;
  });
}

function filterByCategory(items: QaWorkItemSummary[], category: QaWorkflowStateCategory): QaWorkItemSummary[] {
  return items.filter((item) => item.qaCategory === category);
}

function mapStateToCategory(
  state: string,
  mappings: AzureDevOpsStateMapping[] | undefined
): QaWorkflowStateCategory | undefined {
  const explicitMapping = mappings?.find((mapping) => mapping.enabled && mapping.rawStateName.toLowerCase() === state.toLowerCase());
  if (explicitMapping) {
    return explicitMapping.qaCategory;
  }

  const normalized = state.toLowerCase();
  if (normalized.includes("qa")) return "in-qa";
  if (normalized.includes("ready") && normalized.includes("test")) return "ready-to-test";
  if (normalized.includes("resolved") || normalized.includes("closed") || normalized.includes("done")) return "resolved";
  if (normalized.includes("blocked")) return "blocked";
  if (normalized.includes("uat")) return "ready-for-uat";
  return undefined;
}

function normalizeMaxItems(maxItems: number | undefined): number {
  if (maxItems === undefined || !Number.isInteger(maxItems) || maxItems <= 0) {
    return DEFAULT_MAX_ITEMS;
  }

  return Math.min(maxItems, MAX_ITEMS_CAP);
}

function escapeWiqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

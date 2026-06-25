import type { SourceProvider } from "../common/sourceProvider.js";
import type { IsoDateTimeString } from "../common/timestamps.js";
import type { QaPriority, QaRiskLevel } from "../qa/qaEnums.js";
import type { WorkItemType } from "../work-items/workItemContext.js";
import type { BoardScope, QaWorkflowStateCategory } from "../settings/azureDevOpsSettings.js";

export type QaWorkItemSignalType =
  | "priority"
  | "severity"
  | "story-points"
  | "age"
  | "assignment"
  | "state"
  | "blocked-status"
  | "release-risk"
  | "ready-to-retest";

export type QaWorkItemSignal = {
  type: QaWorkItemSignalType;
  label: string;
  value?: string | number | boolean;
  weight?: number;
  explanation?: string;
};

export type QaWorkItemSummary = {
  source: SourceProvider;
  organization: string;
  project: string;
  workItemId: string | number;
  workItemUrl: string;
  type: WorkItemType;
  title: string;
  state: string;
  assignedTo?: string;
  priority?: QaPriority | number | string;
  severity?: QaRiskLevel | string;
  storyPoints?: number;
  tags: string[];
  ageDays?: number;
  isBlocked?: boolean;
  blockedReason?: string;
  qaCategory?: QaWorkflowStateCategory;
  lastUpdatedAt?: IsoDateTimeString;
  sourceUpdatedAt?: IsoDateTimeString;
  signals?: QaWorkItemSignal[];
};

export type QaWorkQueueBucket = {
  id: string;
  label: string;
  qaCategory?: QaWorkflowStateCategory;
  items: QaWorkItemSummary[];
  sourceDescription?: string;
};

export type QaWorkQueue = {
  boardScope: BoardScope;
  generatedAt: IsoDateTimeString;
  buckets: QaWorkQueueBucket[];
  myWork: QaWorkItemSummary[];
  resolvedBugsReadyToRetest: QaWorkItemSummary[];
  suggestedNextWork?: QaWorkItemSummary;
  dataFreshness?: string;
};

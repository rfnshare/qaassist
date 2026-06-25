import type { IsoDateTimeString } from "../common/timestamps.js";
import type { QaWorkItemSummary, QaWorkQueue } from "./workQueue.js";
import type { WorkRecommendation } from "../recommendations/workRecommendation.js";
import type { BoardScope, QaWorkflowStateCategory } from "../settings/azureDevOpsSettings.js";

export type BoardSummaryStatus =
  | "not-connected"
  | "connected"
  | "stale"
  | "partial"
  | "error";

export type BoardSummaryMetric = {
  id: string;
  label: string;
  value?: number | string;
  unit?: string;
  status?: BoardSummaryStatus;
  sourceDescription?: string;
};

export type BoardStateBucket = {
  category: QaWorkflowStateCategory;
  label: string;
  count?: number;
  items?: QaWorkItemSummary[];
  sourceDescription?: string;
};

export type BoardSummary = {
  selectedBoard: BoardScope;
  generatedAt: IsoDateTimeString;
  connectionStatus: BoardSummaryStatus;
  metrics: BoardSummaryMetric[];
  stateBuckets: {
    inQA: BoardStateBucket;
    readyToTest: BoardStateBucket;
    resolved: BoardStateBucket;
    blocked: BoardStateBucket;
    readyForUat: BoardStateBucket;
  };
  myWork: QaWorkItemSummary[];
  resolvedBugsReadyToRetest: QaWorkItemSummary[];
  openRisks: string[];
  dataFreshness?: string;
  sourceDescription?: string;
};

export type BoardSummarySnapshot = {
  summary: BoardSummary;
  workQueue?: QaWorkQueue;
  recommendation?: WorkRecommendation;
  capturedAt: IsoDateTimeString;
  isPreview: boolean;
};

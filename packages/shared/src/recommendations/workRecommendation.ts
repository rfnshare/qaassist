import type { IsoDateTimeString } from "../common/timestamps.js";
import type { QaPriority } from "../qa/qaEnums.js";
import type { QaWorkItemSignal, QaWorkItemSummary } from "../boards/workQueue.js";

export type WorkRecommendationPriority = QaPriority | "urgent";

export type WorkRecommendationSignal = QaWorkItemSignal & {
  confidence?: number;
};

export type WorkRecommendationDecision =
  | "suggested-next"
  | "needs-user-choice"
  | "no-recommendation";

export type WorkRecommendation = {
  recommendedWorkItem?: QaWorkItemSummary;
  decision: WorkRecommendationDecision;
  priority: WorkRecommendationPriority;
  rank?: number;
  reason: string;
  signals: WorkRecommendationSignal[];
  confidence: number;
  assumptions: string[];
  needsUserConfirmation: boolean;
  generatedAt: IsoDateTimeString;
};

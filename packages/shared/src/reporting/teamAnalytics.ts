import type { StoryRequirementAnalysis } from "../analysis/storyRequirementAnalysis.js";
import type { AutomationCandidateMappingResult } from "../automation/automationCandidate.js";
import type { AutomationScaffoldResult } from "../automation/automationScaffold.js";
import type { BoardBriefing } from "../briefings/boardBriefing.js";
import type { BoardSummary } from "../boards/boardSummary.js";
import type { IsoDateTimeString } from "../common/timestamps.js";
import type { ReviewExportResult } from "../export/reviewExport.js";
import type { TestCaseReviewSession } from "../test-cases/testCaseReview.js";
import type { TestPlansCreationResult } from "../test-management/testPlansCreation.js";
import type { TestPlansReadinessResult } from "../test-management/testPlansReadiness.js";
import type { BoardScope } from "../settings/azureDevOpsSettings.js";
import type { WorkItemDetail } from "../work-items/workItemDetail.js";
import type { WritebackPreviewResult } from "../writeback/writebackHelper.js";

export type TeamAnalyticsScope = {
  selectedBoard?: BoardScope;
  label: string;
  scopeType: "current-session" | "selected-board";
};

export type TeamAnalyticsMetric = {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  source: string;
};

export type TeamAnalyticsSection = {
  id:
    | "board-overview"
    | "review-progress"
    | "test-plans-outcomes"
    | "automation-outlook"
    | "exports-and-writeback-previews";
  title: string;
  summary: string;
  items: string[];
};

export type TeamAnalyticsWarning = {
  code:
    | "SESSION_ONLY"
    | "MISSING_BOARD_DATA"
    | "MISSING_REVIEW_DATA"
    | "MISSING_TEST_PLANS_DATA"
    | "MISSING_AUTOMATION_DATA"
    | "MISSING_EXPORT_WRITEBACK_DATA";
  message: string;
};

export type TeamAnalyticsStorySummary = {
  workItemId?: number;
  title?: string;
  state?: string;
  reviewedTotal?: number;
  approvedForExport?: number;
  blocked?: number;
  readinessStatus?: string;
  azureCreationStatus?: string;
  automationReadinessSummary?: string;
};

export type TeamAnalyticsRequest = {
  scope?: TeamAnalyticsScope;
  boardSummary?: BoardSummary;
  briefing?: BoardBriefing;
  workItemDetail?: WorkItemDetail;
  storyAnalysis?: StoryRequirementAnalysis;
  reviewSession?: TestCaseReviewSession;
  readinessResult?: TestPlansReadinessResult;
  creationResult?: TestPlansCreationResult;
  automationMappingResult?: AutomationCandidateMappingResult;
  automationScaffoldResult?: AutomationScaffoldResult;
  exportResult?: ReviewExportResult;
  writebackPreviewResult?: WritebackPreviewResult;
  storySummaries?: TeamAnalyticsStorySummary[];
};

export type TeamAnalyticsResult = {
  generatedAt: IsoDateTimeString;
  scope: TeamAnalyticsScope;
  metrics: TeamAnalyticsMetric[];
  sections: TeamAnalyticsSection[];
  storySummaries: TeamAnalyticsStorySummary[];
  warnings: TeamAnalyticsWarning[];
  disclaimer: string;
};

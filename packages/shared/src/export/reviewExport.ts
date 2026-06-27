import type { StoryRequirementAnalysis } from "../analysis/storyRequirementAnalysis.js";
import type { StoryAnalysisAssistResult } from "../ai/llmProvider.js";
import type { AutomationCandidateMappingResult } from "../automation/automationCandidate.js";
import type { IsoDateTimeString } from "../common/timestamps.js";
import type { TestCaseDraftGenerationResult } from "../test-cases/testCaseDraft.js";
import type { TestCaseReviewSession } from "../test-cases/testCaseReview.js";
import type { TestPlansCreationResult } from "../test-management/testPlansCreation.js";
import type { TestPlansReadinessResult } from "../test-management/testPlansReadiness.js";
import type { WorkItemDetail } from "../work-items/workItemDetail.js";

export type ReviewExportFormat = "json" | "markdown";

export type ReviewExportSection =
  | "story-context"
  | "story-analysis"
  | "ai-assist"
  | "draft-cases"
  | "review-session"
  | "test-plans-readiness"
  | "test-plans-creation"
  | "automation-candidates";

export type ReviewExportRequest = {
  format: ReviewExportFormat;
  selectedSections: ReviewExportSection[];
  workItemDetail?: WorkItemDetail;
  storyAnalysis?: StoryRequirementAnalysis;
  aiAssistResult?: StoryAnalysisAssistResult;
  draftResult?: TestCaseDraftGenerationResult;
  reviewSession?: TestCaseReviewSession;
  readinessResult?: TestPlansReadinessResult;
  creationResult?: TestPlansCreationResult;
  automationMappingResult?: AutomationCandidateMappingResult;
};

export type ReviewExportArtifact = {
  fileName: string;
  mimeType: string;
  content: string;
  format: ReviewExportFormat;
};

export type ReviewExportSummary = {
  workItemId?: number;
  title?: string;
  includedSections: ReviewExportSection[];
  warnings: string[];
  generatedAt: IsoDateTimeString;
};

export type ReviewExportResult = {
  summary: ReviewExportSummary;
  artifact: ReviewExportArtifact;
  disclaimer: string;
};

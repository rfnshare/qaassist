import type { IsoDateTimeString } from "../common/timestamps.js";
import type { TestCaseDraftEvidenceLink, TestCaseDraftWarning } from "../test-cases/testCaseDraft.js";
import type { ReviewedTestCase, TestCaseReviewSession } from "../test-cases/testCaseReview.js";

export type AutomationCandidateType =
  | "ui-playwright"
  | "api"
  | "mixed"
  | "manual-only";

export type AutomationReadiness =
  | "ready"
  | "needs-work"
  | "blocked";

export type AutomationBlockerSeverity =
  | "low"
  | "medium"
  | "high";

export type AutomationExecutionSurface =
  | "browser-ui"
  | "api"
  | "cross-system"
  | "environment-dependent";

export type AutomationCandidateReason = {
  text: string;
  evidence?: string;
};

export type AutomationCandidateBlocker = {
  text: string;
  severity: AutomationBlockerSeverity;
};

export type AutomationMappingOptions = {
  preferUi?: boolean;
  preferApi?: boolean;
  includeBlocked?: boolean;
};

export type AutomationCandidate = {
  reviewedCaseId: string;
  originalDraftId: string;
  title: string;
  candidateType: AutomationCandidateType;
  readiness: AutomationReadiness;
  automatable: boolean;
  reasons: AutomationCandidateReason[];
  blockers: AutomationCandidateBlocker[];
  recommendedSurface: AutomationExecutionSurface;
  recommendedStartingPoint: string;
  evidenceLinks: TestCaseDraftEvidenceLink[];
  warnings: TestCaseDraftWarning[];
};

export type AutomationBlockedCase = {
  reviewedCaseId: string;
  originalDraftId: string;
  title: string;
  status: ReviewedTestCase["status"];
  blockers: AutomationCandidateBlocker[];
};

export type AutomationCandidateMappingRequest = {
  reviewSession: TestCaseReviewSession;
  mappingOptions?: AutomationMappingOptions;
};

export type AutomationCandidateMappingSummary = {
  totalReviewed: number;
  candidateCount: number;
  readyCount: number;
  needsWorkCount: number;
  blockedCount: number;
  manualOnlyCount: number;
};

export type AutomationCandidateMappingResult = {
  generatedAt: IsoDateTimeString;
  workItemId: number;
  workItemTitle: string;
  candidates: AutomationCandidate[];
  blockedCases: AutomationBlockedCase[];
  summary: AutomationCandidateMappingSummary;
  disclaimer: string;
};

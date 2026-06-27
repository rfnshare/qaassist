import type { IsoDateTimeString } from "../common/timestamps.js";
import type { TestCaseDraftStep } from "../test-cases/testCaseDraft.js";
import type { ReviewedTestCase, TestCaseReviewSession } from "../test-cases/testCaseReview.js";

export type TestPlansReadinessMode = "readiness-preview";

export type TestPlansReadinessStatus =
  | "ready-for-confirmation"
  | "blocked"
  | "needs-settings"
  | "no-approved-cases";

export type TestPlansTargetSettings = {
  organization: string;
  project: string;
  team: string;
  testPlanId?: string | number;
  testSuiteId?: string | number;
  areaPath?: string;
  iterationPath?: string;
};

export type TestPlansPreviewFields = {
  title: string;
  steps: TestCaseDraftStep[];
  expectedResult: string;
  areaPath?: string;
  iterationPath?: string;
};

export type TestPlansExportCandidate = {
  reviewedCaseId: string;
  originalDraftId: string;
  title: string;
  objective: string;
  stepsCount: number;
  evidenceLinkCount: number;
  warningCount: number;
  readyForExport: boolean;
  targetPlanId?: string | number;
  targetSuiteId?: string | number;
  previewFields: TestPlansPreviewFields;
  limitations: string[];
};

export type TestPlansExportBlockedItem = {
  originalDraftId: string;
  title: string;
  status: ReviewedTestCase["status"];
  reasons: string[];
};

export type TestPlansReadinessWarning = {
  code:
    | "MISSING_TEST_PLAN"
    | "MISSING_TEST_SUITE"
    | "NO_APPROVED_CASES"
    | "BLOCKED_ITEMS_PRESENT"
    | "PREVIEW_ONLY";
  message: string;
};

export type TestPlansReadinessRequest = {
  reviewSession: TestCaseReviewSession;
  targetSettings: TestPlansTargetSettings;
};

export type TestPlansReadinessResult = {
  mode: TestPlansReadinessMode;
  status: TestPlansReadinessStatus;
  generatedAt: IsoDateTimeString;
  target: TestPlansTargetSettings;
  candidates: TestPlansExportCandidate[];
  blockedItems: TestPlansExportBlockedItem[];
  warnings: TestPlansReadinessWarning[];
  requiredUserConfirmations: string[];
  disclaimer: string;
};

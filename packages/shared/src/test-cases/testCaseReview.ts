import type { IsoDateTimeString } from "../common/timestamps.js";
import type {
  TestCaseDraft,
  TestCaseDraftEvidenceLink,
  TestCaseDraftGenerationResult,
  TestCaseDraftStep,
  TestCaseDraftWarning
} from "./testCaseDraft.js";

export type ReviewedTestCaseStatus =
  | "needs-review"
  | "edited"
  | "approved-for-export"
  | "rejected"
  | "blocked";

export type ReviewedTestCaseDecision =
  | "approve"
  | "reject"
  | "edit"
  | "block";

export type ReviewedTestCaseEdit = {
  field:
    | "title"
    | "objective"
    | "preconditions"
    | "steps"
    | "expectedResult"
    | "reviewerNote";
  editedAt: IsoDateTimeString;
};

export type ReviewedTestCase = {
  originalDraftId: string;
  reviewedTitle: string;
  reviewedObjective: string;
  reviewedPreconditions: string[];
  reviewedSteps: TestCaseDraftStep[];
  reviewedExpectedResult: string;
  reviewerNote?: string;
  status: ReviewedTestCaseStatus;
  decision: ReviewedTestCaseDecision;
  editedByUser: boolean;
  approvedByUser: boolean;
  readyForExport: boolean;
  sourceDraft: TestCaseDraft;
  evidenceLinks: TestCaseDraftEvidenceLink[];
  warnings: TestCaseDraftWarning[];
  edits?: ReviewedTestCaseEdit[];
  updatedAt: IsoDateTimeString;
};

export type TestCaseReviewSummary = {
  totalDrafts: number;
  totalReviewed: number;
  approved: number;
  rejected: number;
  blocked: number;
  edited: number;
  readyForExport: number;
  needsReview: number;
  warnings: string[];
};

export type TestCaseReviewSession = {
  workItemId: number;
  workItemTitle: string;
  startedAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  reviewedCases: ReviewedTestCase[];
  summary: TestCaseReviewSummary;
  disclaimer: string;
};

export type TestCaseReviewNormalizationRequest = {
  workItem: {
    workItemId: number;
    title: string;
  };
  draftResult: TestCaseDraftGenerationResult;
  reviewedCases: ReviewedTestCase[];
};

export type TestCaseReviewNormalizationResult = TestCaseReviewSession;

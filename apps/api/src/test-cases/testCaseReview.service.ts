import type {
  ReviewedTestCase,
  ReviewedTestCaseDecision,
  ReviewedTestCaseStatus,
  TestCaseDraft,
  TestCaseDraftGenerationResult,
  TestCaseDraftStep,
  TestCaseReviewSession,
  TestCaseReviewSummary
} from "@qa-assist/shared";

export const TEST_CASE_REVIEW_DISCLAIMER =
  "Reviewed cases are local/session review output only. Nothing has been created in Azure Test Plans.";

const REVIEWER_NOTE_MAX_LENGTH = 1000;
const TITLE_MAX_LENGTH = 180;
const OBJECTIVE_MAX_LENGTH = 700;
const EXPECTED_RESULT_MAX_LENGTH = 700;
const STEP_TEXT_MAX_LENGTH = 700;

const VALID_STATUSES: ReviewedTestCaseStatus[] = [
  "needs-review",
  "edited",
  "approved-for-export",
  "rejected",
  "blocked"
];

const VALID_DECISIONS: ReviewedTestCaseDecision[] = [
  "approve",
  "reject",
  "edit",
  "block"
];

export function normalizeTestCaseReviewSession(input: {
  workItem: { workItemId: number; title: string };
  draftResult: TestCaseDraftGenerationResult;
  reviewedCases: ReviewedTestCase[];
}): TestCaseReviewSession {
  const now = new Date().toISOString();
  const draftMap = new Map(input.draftResult.draftCases.map((draftCase) => [draftCase.id, draftCase]));
  const reviewedCases = input.reviewedCases
    .slice(0, input.draftResult.draftCases.length)
    .map((reviewedCase, index) => normalizeReviewedCase(reviewedCase, draftMap, now, index));
  const summary = buildSummary(input.draftResult.draftCases.length, reviewedCases);

  return {
    workItemId: input.workItem.workItemId,
    workItemTitle: trimAndCap(input.workItem.title, TITLE_MAX_LENGTH),
    startedAt: input.draftResult.generatedAt,
    updatedAt: now,
    reviewedCases,
    summary,
    disclaimer: TEST_CASE_REVIEW_DISCLAIMER
  };
}

function normalizeReviewedCase(
  reviewedCase: ReviewedTestCase,
  draftMap: Map<string, TestCaseDraft>,
  updatedAt: string,
  index: number
): ReviewedTestCase {
  if (!reviewedCase || typeof reviewedCase !== "object") {
    throw badRequest(`reviewedCases[${index}] must be an object.`);
  }

  if (!reviewedCase.originalDraftId || typeof reviewedCase.originalDraftId !== "string") {
    throw badRequest(`reviewedCases[${index}].originalDraftId is required.`);
  }

  const sourceDraft = draftMap.get(reviewedCase.originalDraftId);
  if (!sourceDraft) {
    throw badRequest(`reviewedCases[${index}].originalDraftId does not match a generated draft.`);
  }

  if (!VALID_STATUSES.includes(reviewedCase.status)) {
    throw badRequest(`reviewedCases[${index}].status is invalid.`);
  }

  if (!VALID_DECISIONS.includes(reviewedCase.decision)) {
    throw badRequest(`reviewedCases[${index}].decision is invalid.`);
  }

  validateReviewDecision(reviewedCase, index);

  const normalizedSteps = normalizeSteps(reviewedCase.reviewedSteps, index);
  const normalizedApprovedByUser = isApprovedForExport(reviewedCase);
  const normalizedReadyForExport = normalizedApprovedByUser;

  if (reviewedCase.status === "approved-for-export") {
    validateApprovedCase(reviewedCase, normalizedSteps, sourceDraft, index);
  }

  return {
    originalDraftId: reviewedCase.originalDraftId,
    reviewedTitle: trimAndCap(reviewedCase.reviewedTitle, TITLE_MAX_LENGTH),
    reviewedObjective: trimAndCap(reviewedCase.reviewedObjective, OBJECTIVE_MAX_LENGTH),
    reviewedPreconditions: Array.isArray(reviewedCase.reviewedPreconditions)
      ? reviewedCase.reviewedPreconditions.filter(isString).map((item) => trimAndCap(item, OBJECTIVE_MAX_LENGTH)).filter(Boolean)
      : sourceDraft.preconditions,
    reviewedSteps: normalizedSteps,
    reviewedExpectedResult: trimAndCap(reviewedCase.reviewedExpectedResult, EXPECTED_RESULT_MAX_LENGTH),
    reviewerNote: normalizeOptionalText(reviewedCase.reviewerNote, REVIEWER_NOTE_MAX_LENGTH),
    status: reviewedCase.status,
    decision: reviewedCase.decision,
    editedByUser: reviewedCase.editedByUser === true,
    approvedByUser: normalizedApprovedByUser,
    readyForExport: normalizedReadyForExport,
    sourceDraft,
    evidenceLinks: sourceDraft.evidenceLinks,
    warnings: sourceDraft.warnings,
    edits: Array.isArray(reviewedCase.edits) ? reviewedCase.edits : undefined,
    updatedAt
  };
}

function validateReviewDecision(reviewedCase: ReviewedTestCase, index: number): void {
  if (reviewedCase.status === "approved-for-export" && reviewedCase.approvedByUser !== true) {
    throw badRequest(`reviewedCases[${index}] approved-for-export requires approvedByUser true.`);
  }

  if (reviewedCase.status === "approved-for-export" && reviewedCase.decision !== "approve") {
    throw badRequest(`reviewedCases[${index}] approved-for-export requires approve decision.`);
  }

  if (reviewedCase.readyForExport === true && !isApprovedForExport(reviewedCase)) {
    throw badRequest(`reviewedCases[${index}] readyForExport requires approved-for-export status, approve decision, and approvedByUser true.`);
  }

  if ((reviewedCase.status === "rejected" || reviewedCase.status === "blocked") && reviewedCase.readyForExport === true) {
    throw badRequest(`reviewedCases[${index}] rejected or blocked cases cannot be readyForExport.`);
  }

  if ((reviewedCase.status === "rejected" || reviewedCase.status === "blocked") && reviewedCase.approvedByUser === true) {
    throw badRequest(`reviewedCases[${index}] rejected or blocked cases cannot be approvedByUser.`);
  }
}

function validateApprovedCase(
  reviewedCase: ReviewedTestCase,
  steps: TestCaseDraftStep[],
  sourceDraft: TestCaseDraft,
  index: number
): void {
  if (!isNonEmptyString(reviewedCase.reviewedTitle)) {
    throw badRequest(`reviewedCases[${index}].reviewedTitle is required before approval.`);
  }

  if (!isNonEmptyString(reviewedCase.reviewedObjective)) {
    throw badRequest(`reviewedCases[${index}].reviewedObjective is required before approval.`);
  }

  if (!isNonEmptyString(reviewedCase.reviewedExpectedResult)) {
    throw badRequest(`reviewedCases[${index}].reviewedExpectedResult is required before approval.`);
  }

  if (steps.length === 0) {
    throw badRequest(`reviewedCases[${index}].reviewedSteps must include at least one step before approval.`);
  }

  if (sourceDraft.evidenceLinks.length === 0) {
    throw badRequest(`reviewedCases[${index}] source draft must include at least one evidence link before approval.`);
  }
}

function isApprovedForExport(reviewedCase: ReviewedTestCase): boolean {
  return reviewedCase.status === "approved-for-export" &&
    reviewedCase.decision === "approve" &&
    reviewedCase.approvedByUser === true;
}

function normalizeSteps(value: unknown, caseIndex: number): TestCaseDraftStep[] {
  if (!Array.isArray(value)) {
    throw badRequest(`reviewedCases[${caseIndex}].reviewedSteps must be an array.`);
  }

  return value.map((stepValue, stepIndex) => {
    if (!stepValue || typeof stepValue !== "object") {
      throw badRequest(`reviewedCases[${caseIndex}].reviewedSteps[${stepIndex}] must be an object.`);
    }

    const step = stepValue as Partial<TestCaseDraftStep>;
    if (!Number.isSafeInteger(step.order) || !step.order || step.order <= 0) {
      throw badRequest(`reviewedCases[${caseIndex}].reviewedSteps[${stepIndex}].order must be a positive integer.`);
    }

    if (!isNonEmptyString(step.action)) {
      throw badRequest(`reviewedCases[${caseIndex}].reviewedSteps[${stepIndex}].action is required.`);
    }

    if (!isNonEmptyString(step.expectedResult)) {
      throw badRequest(`reviewedCases[${caseIndex}].reviewedSteps[${stepIndex}].expectedResult is required.`);
    }

    return {
      order: step.order,
      action: trimAndCap(step.action, STEP_TEXT_MAX_LENGTH),
      expectedResult: trimAndCap(step.expectedResult, STEP_TEXT_MAX_LENGTH)
    };
  });
}

function buildSummary(totalDrafts: number, reviewedCases: ReviewedTestCase[]): TestCaseReviewSummary {
  const summary: TestCaseReviewSummary = {
    totalDrafts,
    totalReviewed: reviewedCases.length,
    approved: reviewedCases.filter((reviewedCase) => reviewedCase.status === "approved-for-export").length,
    rejected: reviewedCases.filter((reviewedCase) => reviewedCase.status === "rejected").length,
    blocked: reviewedCases.filter((reviewedCase) => reviewedCase.status === "blocked").length,
    edited: reviewedCases.filter((reviewedCase) => reviewedCase.editedByUser || reviewedCase.status === "edited").length,
    readyForExport: reviewedCases.filter((reviewedCase) => reviewedCase.readyForExport).length,
    needsReview: reviewedCases.filter((reviewedCase) => reviewedCase.status === "needs-review").length,
    warnings: []
  };

  if (summary.readyForExport === 0) {
    summary.warnings.push("No cases are approved for later export yet.");
  }

  if (summary.totalReviewed < totalDrafts) {
    summary.warnings.push("Some generated drafts were not included in this review session.");
  }

  return summary;
}

function normalizeOptionalText(value: unknown, maxLength: number): string | undefined {
  if (!isString(value)) {
    return undefined;
  }

  const normalized = trimAndCap(value, maxLength);
  return normalized || undefined;
}

function trimAndCap(value: unknown, maxLength: number): string {
  if (!isString(value)) {
    return "";
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

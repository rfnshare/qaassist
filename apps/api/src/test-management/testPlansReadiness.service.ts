import type {
  ReviewedTestCase,
  TestPlansExportBlockedItem,
  TestPlansExportCandidate,
  TestPlansReadinessResult,
  TestPlansReadinessWarning,
  TestPlansTargetSettings,
  TestCaseReviewSession
} from "@qa-assist/shared";

export const TEST_PLANS_READINESS_DISCLAIMER =
  "Readiness preview only. Nothing has been created or updated in Azure Test Plans.";

export function buildTestPlansReadinessPreview(input: {
  reviewSession: TestCaseReviewSession;
  targetSettings: TestPlansTargetSettings;
}): TestPlansReadinessResult {
  const candidates: TestPlansExportCandidate[] = [];
  const blockedItems: TestPlansExportBlockedItem[] = [];

  for (const reviewedCase of input.reviewSession.reviewedCases) {
    const blockedReasons = getBlockedReasons(reviewedCase);

    if (blockedReasons.length === 0) {
      candidates.push(buildCandidate(reviewedCase, input.targetSettings));
    } else {
      blockedItems.push({
        originalDraftId: reviewedCase.originalDraftId,
        title: reviewedCase.reviewedTitle || reviewedCase.sourceDraft.title,
        status: reviewedCase.status,
        reasons: blockedReasons
      });
    }
  }

  const warnings = buildWarnings(candidates, blockedItems, input.targetSettings);

  return {
    mode: "readiness-preview",
    status: getReadinessStatus(candidates, blockedItems, input.targetSettings),
    generatedAt: new Date().toISOString(),
    target: input.targetSettings,
    candidates,
    blockedItems,
    warnings,
    requiredUserConfirmations: [
      "QA confirms reviewed cases are correct.",
      "QA confirms Azure Test Plan and Suite target.",
      "QA understands no item has been created yet.",
      "Future write-back requires explicit final confirmation."
    ],
    disclaimer: TEST_PLANS_READINESS_DISCLAIMER
  };
}

function getBlockedReasons(reviewedCase: ReviewedTestCase): string[] {
  const reasons: string[] = [];
  const evidenceLinks = Array.isArray(reviewedCase.evidenceLinks) ? reviewedCase.evidenceLinks : [];
  const reviewedSteps = Array.isArray(reviewedCase.reviewedSteps) ? reviewedCase.reviewedSteps : [];
  const reviewedTitle = typeof reviewedCase.reviewedTitle === "string" ? reviewedCase.reviewedTitle : "";
  const reviewedExpectedResult = typeof reviewedCase.reviewedExpectedResult === "string" ? reviewedCase.reviewedExpectedResult : "";

  if (reviewedCase.status !== "approved-for-export") {
    reasons.push(`Case status is ${reviewedCase.status}, not approved-for-export.`);
  }

  if (reviewedCase.approvedByUser !== true) {
    reasons.push("Case has not been explicitly approved by the user.");
  }

  if (reviewedCase.readyForExport !== true) {
    reasons.push("Case is not marked ready for later export.");
  }

  if (evidenceLinks.length === 0) {
    reasons.push("Case has no evidence links.");
  }

  if (reviewedSteps.length === 0) {
    reasons.push("Case has no reviewed steps.");
  }

  if (!reviewedTitle.trim()) {
    reasons.push("Case has no reviewed title.");
  }

  if (!reviewedExpectedResult.trim()) {
    reasons.push("Case has no reviewed expected result.");
  }

  return reasons;
}

function buildCandidate(reviewedCase: ReviewedTestCase, target: TestPlansTargetSettings): TestPlansExportCandidate {
  const evidenceLinks = Array.isArray(reviewedCase.evidenceLinks) ? reviewedCase.evidenceLinks : [];
  const warnings = Array.isArray(reviewedCase.warnings) ? reviewedCase.warnings : [];
  const reviewedSteps = Array.isArray(reviewedCase.reviewedSteps) ? reviewedCase.reviewedSteps : [];

  return {
    reviewedCaseId: reviewedCase.originalDraftId,
    originalDraftId: reviewedCase.originalDraftId,
    title: reviewedCase.reviewedTitle,
    objective: reviewedCase.reviewedObjective,
    stepsCount: reviewedSteps.length,
    evidenceLinkCount: evidenceLinks.length,
    warningCount: warnings.length,
    readyForExport: true,
    targetPlanId: target.testPlanId,
    targetSuiteId: target.testSuiteId,
    previewFields: {
      title: reviewedCase.reviewedTitle,
      steps: reviewedSteps.map((step) => ({
        order: step.order,
        action: step.action,
        expectedResult: step.expectedResult
      })),
      expectedResult: reviewedCase.reviewedExpectedResult,
      areaPath: target.areaPath,
      iterationPath: target.iterationPath
    },
    limitations: [
      "Preview only; no Azure Test Plans item has been created.",
      "Automation metadata is not generated.",
      "Future write-back will require explicit final confirmation."
    ]
  };
}

function getReadinessStatus(
  candidates: TestPlansExportCandidate[],
  blockedItems: TestPlansExportBlockedItem[],
  target: TestPlansTargetSettings
): TestPlansReadinessResult["status"] {
  if (candidates.length === 0) {
    return blockedItems.length > 0 ? "blocked" : "no-approved-cases";
  }

  if (!target.testPlanId || !target.testSuiteId) {
    return "needs-settings";
  }

  return "ready-for-confirmation";
}

function buildWarnings(
  candidates: TestPlansExportCandidate[],
  blockedItems: TestPlansExportBlockedItem[],
  target: TestPlansTargetSettings
): TestPlansReadinessWarning[] {
  const warnings: TestPlansReadinessWarning[] = [
    {
      code: "PREVIEW_ONLY",
      message: TEST_PLANS_READINESS_DISCLAIMER
    }
  ];

  if (candidates.length === 0) {
    warnings.push({
      code: "NO_APPROVED_CASES",
      message: "No reviewed cases are eligible for future Azure Test Plans creation."
    });
  }

  if (!target.testPlanId) {
    warnings.push({
      code: "MISSING_TEST_PLAN",
      message: "Azure Test Plan ID is missing."
    });
  }

  if (!target.testSuiteId) {
    warnings.push({
      code: "MISSING_TEST_SUITE",
      message: "Azure Test Suite ID is missing."
    });
  }

  if (blockedItems.length > 0) {
    warnings.push({
      code: "BLOCKED_ITEMS_PRESENT",
      message: `${blockedItems.length} reviewed case${blockedItems.length === 1 ? "" : "s"} cannot be exported later without review changes.`
    });
  }

  return warnings;
}

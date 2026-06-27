import type {
  AutomationBlockedCase,
  AutomationCandidate,
  AutomationCandidateBlocker,
  AutomationCandidateMappingRequest,
  AutomationCandidateMappingResult,
  AutomationCandidateType,
  AutomationExecutionSurface,
  AutomationMappingOptions,
  AutomationReadiness,
  ReviewedTestCase,
  TestCaseDraftWarning
} from "@qa-assist/shared";

export const AUTOMATION_MAPPING_DISCLAIMER =
  "Automation candidate mapping is a planning aid only. No automation code or repository changes have been created.";

const UI_SIGNALS = /\b(ui|page|screen|button|form|field|browser|click|dropdown|modal|dialog|link|tab|grid|table|toast|banner)\b/i;
const API_SIGNALS = /\b(api|endpoint|service|request|response|contract|payload|http|integration|webhook|json)\b/i;
const MANUAL_SIGNALS = /\b(captcha|otp|email|sms|third[- ]party|3rd[- ]party|manual observation|visual inspection|external dependency|payment gateway|manual verification)\b/i;
const AMBIGUITY_SIGNALS = /\b(ambiguous|unclear|assumption|needs confirmation|not validated|missing|incomplete|blocked|unknown)\b/i;

export function mapAutomationCandidates(
  request: AutomationCandidateMappingRequest
): AutomationCandidateMappingResult {
  const mappingOptions = normalizeOptions(request.mappingOptions);
  const blockedCases: AutomationBlockedCase[] = [];
  const candidates: AutomationCandidate[] = [];

  for (const reviewedCase of request.reviewSession.reviewedCases) {
    if (reviewedCase.status === "rejected" || reviewedCase.status === "blocked") {
      const blockedCase = buildBlockedCase(reviewedCase);
      blockedCases.push(blockedCase);

      if (mappingOptions.includeBlocked) {
        candidates.push(buildCandidate(reviewedCase, mappingOptions, blockedCase.blockers));
      }

      continue;
    }

    candidates.push(buildCandidate(reviewedCase, mappingOptions));
  }

  return {
    generatedAt: new Date().toISOString(),
    workItemId: request.reviewSession.workItemId,
    workItemTitle: request.reviewSession.workItemTitle,
    candidates: candidates.slice(0, 20),
    blockedCases: blockedCases.slice(0, 20),
    summary: {
      totalReviewed: request.reviewSession.reviewedCases.length,
      candidateCount: candidates.length,
      readyCount: candidates.filter((candidate) => candidate.readiness === "ready").length,
      needsWorkCount: candidates.filter((candidate) => candidate.readiness === "needs-work").length,
      blockedCount: blockedCases.length,
      manualOnlyCount: candidates.filter((candidate) => candidate.candidateType === "manual-only").length
    },
    disclaimer: AUTOMATION_MAPPING_DISCLAIMER
  };
}

function normalizeOptions(options: AutomationMappingOptions | undefined): Required<AutomationMappingOptions> {
  return {
    preferUi: options?.preferUi ?? true,
    preferApi: options?.preferApi ?? false,
    includeBlocked: options?.includeBlocked ?? false
  };
}

function buildBlockedCase(reviewedCase: ReviewedTestCase): AutomationBlockedCase {
  return {
    reviewedCaseId: getReviewedCaseId(reviewedCase),
    originalDraftId: reviewedCase.originalDraftId,
    title: getTitle(reviewedCase),
    status: reviewedCase.status,
    blockers: [
      {
        text: reviewedCase.status === "rejected"
          ? "Rejected review decisions are excluded from automation planning by default."
          : "Blocked review decisions need QA resolution before automation planning.",
        severity: "high"
      }
    ]
  };
}

function buildCandidate(
  reviewedCase: ReviewedTestCase,
  options: Required<AutomationMappingOptions>,
  inheritedBlockers: AutomationCandidateBlocker[] = []
): AutomationCandidate {
  const text = getCaseText(reviewedCase);
  const hasUiSignals = UI_SIGNALS.test(text);
  const hasApiSignals = API_SIGNALS.test(text);
  const hasManualSignals = MANUAL_SIGNALS.test(text);
  const hasAmbiguitySignals = AMBIGUITY_SIGNALS.test(text) || reviewedCase.warnings.some(isMajorWarning);
  const hasEvidence = reviewedCase.evidenceLinks.length > 0;
  const hasExplicitSteps = reviewedCase.reviewedSteps.length > 0
    && reviewedCase.reviewedSteps.every((step) => step.action.trim().length > 0 && step.expectedResult.trim().length > 0);
  const candidateType = chooseCandidateType({
    hasUiSignals,
    hasApiSignals,
    hasManualSignals,
    options
  });
  const blockers = [
    ...inheritedBlockers,
    ...buildBlockers({
      reviewedCase,
      hasEvidence,
      hasExplicitSteps,
      hasManualSignals,
      hasAmbiguitySignals
    })
  ];
  const readiness = chooseReadiness(reviewedCase, blockers, hasEvidence, hasExplicitSteps, hasManualSignals);

  return {
    reviewedCaseId: getReviewedCaseId(reviewedCase),
    originalDraftId: reviewedCase.originalDraftId,
    title: getTitle(reviewedCase),
    candidateType,
    readiness,
    automatable: readiness !== "blocked" && candidateType !== "manual-only",
    reasons: buildReasons({
      candidateType,
      hasUiSignals,
      hasApiSignals,
      hasEvidence,
      hasExplicitSteps,
      reviewedCase
    }),
    blockers,
    recommendedSurface: chooseSurface(candidateType, hasManualSignals),
    recommendedStartingPoint: chooseStartingPoint(candidateType, readiness),
    evidenceLinks: reviewedCase.evidenceLinks,
    warnings: reviewedCase.warnings
  };
}

function chooseCandidateType(input: {
  hasUiSignals: boolean;
  hasApiSignals: boolean;
  hasManualSignals: boolean;
  options: Required<AutomationMappingOptions>;
}): AutomationCandidateType {
  if (input.hasManualSignals) {
    return "manual-only";
  }

  if (input.hasUiSignals && input.hasApiSignals) {
    return "mixed";
  }

  if (input.hasApiSignals || input.options.preferApi) {
    return "api";
  }

  if (input.hasUiSignals || input.options.preferUi) {
    return "ui-playwright";
  }

  return "manual-only";
}

function chooseReadiness(
  reviewedCase: ReviewedTestCase,
  blockers: AutomationCandidateBlocker[],
  hasEvidence: boolean,
  hasExplicitSteps: boolean,
  hasManualSignals: boolean
): AutomationReadiness {
  if (reviewedCase.status === "blocked" || reviewedCase.status === "rejected" || hasManualSignals) {
    return "blocked";
  }

  if (blockers.some((blocker) => blocker.severity === "high")) {
    return "blocked";
  }

  if (reviewedCase.status === "approved-for-export" && reviewedCase.readyForExport && hasEvidence && hasExplicitSteps && blockers.length === 0) {
    return "ready";
  }

  return "needs-work";
}

function buildBlockers(input: {
  reviewedCase: ReviewedTestCase;
  hasEvidence: boolean;
  hasExplicitSteps: boolean;
  hasManualSignals: boolean;
  hasAmbiguitySignals: boolean;
}): AutomationCandidateBlocker[] {
  const blockers: AutomationCandidateBlocker[] = [];

  if (!input.hasEvidence) {
    blockers.push({ text: "Evidence links are missing, so the case is not ready for automation planning.", severity: "medium" });
  }

  if (!input.hasExplicitSteps) {
    blockers.push({ text: "Steps or expected results need to be explicit before automation can be planned.", severity: "medium" });
  }

  if (input.hasManualSignals) {
    blockers.push({ text: "Manual or external dependency signals were detected.", severity: "high" });
  }

  if (input.hasAmbiguitySignals) {
    blockers.push({ text: "Warnings or wording indicate assumptions, ambiguity, or missing confirmation.", severity: "medium" });
  }

  if (input.reviewedCase.status !== "approved-for-export") {
    blockers.push({ text: "Only approved-for-export reviewed cases can be ready automation candidates.", severity: "medium" });
  }

  return blockers;
}

function buildReasons(input: {
  candidateType: AutomationCandidateType;
  hasUiSignals: boolean;
  hasApiSignals: boolean;
  hasEvidence: boolean;
  hasExplicitSteps: boolean;
  reviewedCase: ReviewedTestCase;
}) {
  const reasons = [
    {
      text: `Mapped as ${input.candidateType} from reviewed case wording and evidence.`,
      evidence: input.reviewedCase.evidenceLinks[0]?.label
    }
  ];

  if (input.hasUiSignals) {
    reasons.push({ text: "UI/browser interaction signals were detected in the reviewed case.", evidence: "reviewed steps" });
  }

  if (input.hasApiSignals) {
    reasons.push({ text: "API/service interaction signals were detected in the reviewed case.", evidence: "reviewed steps" });
  }

  if (input.hasEvidence) {
    reasons.push({ text: "The reviewed case keeps source evidence links.", evidence: `${input.reviewedCase.evidenceLinks.length} evidence link(s)` });
  }

  if (input.hasExplicitSteps) {
    reasons.push({ text: "Reviewed steps include explicit actions and expected results.", evidence: `${input.reviewedCase.reviewedSteps.length} step(s)` });
  }

  return reasons;
}

function chooseSurface(candidateType: AutomationCandidateType, hasManualSignals: boolean): AutomationExecutionSurface {
  if (hasManualSignals || candidateType === "manual-only") {
    return "environment-dependent";
  }

  if (candidateType === "api") {
    return "api";
  }

  if (candidateType === "mixed") {
    return "cross-system";
  }

  return "browser-ui";
}

function chooseStartingPoint(candidateType: AutomationCandidateType, readiness: AutomationReadiness): string {
  if (readiness === "blocked") {
    return "Keep manual until blockers are resolved.";
  }

  if (candidateType === "api") {
    return "Start with API contract test planning.";
  }

  if (candidateType === "mixed") {
    return "Start by separating API setup from Playwright browser assertions.";
  }

  if (candidateType === "manual-only") {
    return "Keep manual until the manual dependency is removed or isolated.";
  }

  return "Start with Playwright happy-path flow planning.";
}

function getCaseText(reviewedCase: ReviewedTestCase): string {
  return [
    reviewedCase.reviewedTitle,
    reviewedCase.reviewedObjective,
    reviewedCase.reviewedExpectedResult,
    reviewedCase.reviewerNote,
    ...reviewedCase.reviewedPreconditions,
    ...reviewedCase.reviewedSteps.flatMap((step) => [step.action, step.expectedResult]),
    ...reviewedCase.evidenceLinks.flatMap((link) => [link.label, link.excerpt]),
    ...reviewedCase.warnings.map((warning) => warning.message)
  ].filter(Boolean).join(" ");
}

function getReviewedCaseId(reviewedCase: ReviewedTestCase): string {
  return `${reviewedCase.originalDraftId}:${reviewedCase.status}`;
}

function getTitle(reviewedCase: ReviewedTestCase): string {
  return reviewedCase.reviewedTitle.trim() || reviewedCase.sourceDraft.title;
}

function isMajorWarning(warning: TestCaseDraftWarning): boolean {
  return warning.code === "BLOCKED_BY_GAPS"
    || warning.code === "MISSING_ACCEPTANCE_CRITERIA"
    || warning.code === "WEAK_EVIDENCE"
    || warning.code === "NEEDS_CONFIRMATION";
}

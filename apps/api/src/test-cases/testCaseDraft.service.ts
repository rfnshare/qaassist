import type {
  StoryRequirementAnalysis,
  StoryTestArea,
  TestCaseDraft,
  TestCaseDraftCertainty,
  TestCaseDraftEvidenceLink,
  TestCaseDraftGenerationRequest,
  TestCaseDraftGenerationResult,
  TestCaseDraftPriority,
  TestCaseDraftSelectedInputs,
  TestCaseDraftStatus,
  TestCaseDraftWarning,
  WorkItemDetail
} from "@qa-assist/shared";
import {
  DEFAULT_DRAFT_INPUTS,
  MAX_TEST_CASE_DRAFTS,
  TEST_CASE_DRAFT_DISCLAIMER
} from "./testCaseDraft.rules.js";

export function generateDeterministicTestCaseDrafts(
  request: TestCaseDraftGenerationRequest
): TestCaseDraftGenerationResult {
  const selectedInputs = { ...DEFAULT_DRAFT_INPUTS, ...(request.selectedDraftInputs ?? {}) };
  const usableLinkedEvidence = getUsableLinkedEvidence(request.analysis, selectedInputs);
  const blockedBy = getBlockingReasons(request.analysis);
  const draftCases: TestCaseDraft[] = [];

  if (isBugWorkItem(request.workItem)) {
    draftCases.push(buildBugVerificationDraft(request.workItem, request.analysis, blockedBy));
  }

  if (request.analysis.acceptanceCriteriaStatus === "present" && selectedInputs.includePositivePath) {
    draftCases.push(buildAcceptanceCriteriaDraft(request.workItem, request.analysis, blockedBy));
  }

  if (request.analysis.descriptionStatus === "present" && selectedInputs.includePositivePath) {
    draftCases.push(buildHappyPathDraft(request.workItem, request.analysis, blockedBy));
  }

  if ((request.analysis.acceptanceCriteriaStatus === "missing" || request.analysis.acceptanceCriteriaStatus === "weak") && selectedInputs.includeNegativePath) {
    draftCases.push(buildGapReviewDraft(request.workItem, request.analysis));
  }

  for (const area of request.analysis.likelyTestAreas.slice(0, 5)) {
    if (draftCases.length >= MAX_TEST_CASE_DRAFTS) break;
    draftCases.push(buildAreaDraft(request.workItem, area, request.analysis, blockedBy, selectedInputs));
  }

  if (usableLinkedEvidence.length > 0 && draftCases.length < MAX_TEST_CASE_DRAFTS) {
    draftCases.push(buildLinkedKnowledgeReviewDraft(request.workItem, request.analysis, usableLinkedEvidence));
  }

  if (selectedInputs.includeRegression && draftCases.length < MAX_TEST_CASE_DRAFTS) {
    draftCases.push(buildRegressionDraft(request.workItem, request.analysis, blockedBy));
  }

  if (draftCases.length === 0) {
    draftCases.push(buildGapReviewDraft(request.workItem, request.analysis));
  }

  const cappedDraftCases = draftCases.slice(0, MAX_TEST_CASE_DRAFTS).map(ensureEvidenceLinks);
  const warnings = buildSuiteWarnings(request.analysis, blockedBy);

  return {
    generatedAt: new Date().toISOString(),
    workItemId: request.workItem.workItemId,
    workItemTitle: request.workItem.title,
    mode: "deterministic-preview",
    draftCases: cappedDraftCases,
    blockedBy,
    assumptions: [
      "Drafts use only fetched work item detail, deterministic analysis output, and explicitly linked evidence.",
      "Drafts are not final test cases and require QA review before use.",
      ...request.analysis.assumptions.slice(0, 3)
    ],
    needsConfirmation: request.analysis.needsConfirmation.slice(0, 6),
    coverageSummary: buildCoverageSummary(cappedDraftCases, request.analysis),
    warnings,
    disclaimer: TEST_CASE_DRAFT_DISCLAIMER,
    linkedKnowledgeEvidenceUsed: usableLinkedEvidence
  };
}

function buildAcceptanceCriteriaDraft(
  workItem: WorkItemDetail,
  analysis: StoryRequirementAnalysis,
  blockedBy: string[]
): TestCaseDraft {
  return draft({
    id: draftId(workItem, "acceptance-criteria"),
    title: "Cover returned acceptance criteria",
    objective: "Verify the work item against the returned acceptance criteria evidence.",
    testType: "positive",
    priority: blockedBy.length > 0 ? "high" : "medium",
    certainty: "source-backed",
    status: statusFor(blockedBy, "draft"),
    evidenceLinks: [
      evidenceLink("acceptance-criteria", "Acceptance criteria status", analysis.acceptanceCriteriaStatus, "source-backed")
    ],
    warnings: warningsForAnalysis(analysis, blockedBy),
    sourceSummary: "Generated from acceptance criteria status and fetched work item evidence.",
    steps: [
      step(1, "Review the returned acceptance criteria evidence for this work item.", "Acceptance criteria are understood before execution."),
      step(2, "Prepare the workflow or data described by the work item evidence.", "The test setup reflects the available evidence."),
      step(3, "Perform the described behavior in the application under test.", "The behavior can be observed and compared with the evidence."),
      step(4, "Verify each returned acceptance criterion and record the actual result.", "Results are recorded against the acceptance criteria.")
    ],
    expectedResult: "Returned acceptance criteria are satisfied or any discrepancy is captured for review."
  });
}

function buildHappyPathDraft(
  workItem: WorkItemDetail,
  analysis: StoryRequirementAnalysis,
  blockedBy: string[]
): TestCaseDraft {
  return draft({
    id: draftId(workItem, "happy-path"),
    title: "Verify described happy-path behavior",
    objective: "Exercise the behavior described by the work item description without adding unsupported domain detail.",
    testType: "positive",
    priority: "medium",
    certainty: "source-backed",
    status: statusFor(blockedBy, "draft"),
    evidenceLinks: [
      evidenceLink("description", "Description status", analysis.descriptionStatus, "source-backed")
    ],
    warnings: warningsForAnalysis(analysis, blockedBy),
    sourceSummary: "Generated from description status and Story analysis output.",
    steps: [
      step(1, "Review the fetched description and analysis summary.", "The intended behavior is understood from available evidence."),
      step(2, "Perform the main described workflow.", "The workflow can be completed without unexpected failure."),
      step(3, "Compare observed behavior with the fetched description.", "Observed behavior matches available evidence."),
      step(4, "Record actual result and any unanswered questions.", "Open questions remain visible for QA/BA/PO review.")
    ],
    expectedResult: "The described behavior works as supported by the fetched evidence."
  });
}

function buildBugVerificationDraft(
  workItem: WorkItemDetail,
  analysis: StoryRequirementAnalysis,
  blockedBy: string[]
): TestCaseDraft {
  return draft({
    id: draftId(workItem, "bug-verification"),
    title: "Verify bug fix and regression risk",
    objective: "Confirm the bug fix behavior and identify nearby regression checks.",
    testType: "bug-verification",
    priority: "high",
    certainty: "needs-confirmation",
    status: statusFor(blockedBy, "needs-review"),
    evidenceLinks: [evidenceLink("work-item-type", "Bug work item", workItem.workItemType, "source-backed")],
    warnings: warningsForAnalysis(analysis, blockedBy),
    sourceSummary: "Generated because the work item type is bug.",
    steps: [
      step(1, "Review the bug evidence and any returned repro/acceptance details.", "The failing path and expected behavior are understood where evidence exists."),
      step(2, "Attempt the previously failing path or closest described workflow.", "The issue no longer reproduces or remaining ambiguity is recorded."),
      step(3, "Confirm expected and actual result with QA/BA/PO if evidence is incomplete.", "Unclear expected results are not treated as final."),
      step(4, "Run a nearby regression check around the changed behavior.", "No obvious regression is observed in adjacent behavior.")
    ],
    expectedResult: "The bug fix is verified from available evidence, with unclear repro or expected behavior flagged for confirmation."
  });
}

function isBugWorkItem(workItem: WorkItemDetail): boolean {
  return workItem.workItemType.toLowerCase() === "bug";
}

function buildGapReviewDraft(workItem: WorkItemDetail, analysis: StoryRequirementAnalysis): TestCaseDraft {
  return draft({
    id: draftId(workItem, "gap-review"),
    title: "Review requirement gaps before test design",
    objective: "Block confident execution until weak or missing evidence is clarified.",
    testType: "review",
    priority: "high",
    certainty: "needs-confirmation",
    status: "blocked-by-gaps",
    evidenceLinks: ensureEvidenceLinks(analysis.gaps.slice(0, 3).map((gap, index) =>
      evidenceLink("analysis", `Gap ${index + 1}`, gap.text, gap.certainty)
    )),
    warnings: [
      warning("WEAK_EVIDENCE", "Acceptance criteria or description evidence is missing or weak."),
      ...warningsForAnalysis(analysis, analysis.gaps.filter((gap) => gap.severity === "high").map((gap) => gap.text))
    ],
    sourceSummary: "Generated to keep weak or missing requirement evidence visible before drafting confident cases.",
    steps: [
      step(1, "Review the listed gaps and questions from the Story analysis.", "Open evidence gaps are visible."),
      step(2, "Confirm expected behavior, scope, and acceptance criteria with QA/BA/PO.", "Missing information is confirmed or remains marked as open."),
      step(3, "Update the Story evidence before using generated drafts as execution material.", "Drafts are not treated as final without confirmation.")
    ],
    expectedResult: "Requirement gaps are resolved or explicitly accepted before final test cases are created."
  });
}

function buildAreaDraft(
  workItem: WorkItemDetail,
  area: StoryTestArea,
  analysis: StoryRequirementAnalysis,
  blockedBy: string[],
  selectedInputs: Required<TestCaseDraftSelectedInputs>
): TestCaseDraft {
  const isNegative = selectedInputs.includeNegativePath && area.name.toLowerCase().includes("negative");

  return draft({
    id: draftId(workItem, `area-${slug(area.name)}`),
    title: `Review ${area.name}`,
    objective: area.reason,
    testType: isNegative ? "negative" : "positive",
    priority: area.certainty === "source-backed" ? "medium" : "low",
    certainty: area.certainty,
    status: statusFor(blockedBy, area.certainty === "source-backed" ? "draft" : "needs-review"),
    evidenceLinks: ensureEvidenceLinks(area.evidence.map((item, index) =>
      evidenceLink(item.source, item.label || `Area evidence ${index + 1}`, item.excerpt, area.certainty)
    )),
    warnings: warningsForAnalysis(analysis, blockedBy),
    sourceSummary: "Generated from likely test area in deterministic Story analysis.",
    steps: [
      step(1, `Review evidence for ${area.name}.`, "Evidence and limitations are understood."),
      step(2, "Prepare only the data and setup supported by the Story evidence.", "Setup does not rely on invented requirements."),
      step(3, `Exercise the ${area.name} behavior described by available evidence.`, "Observed behavior can be compared with the evidence."),
      step(4, "Record actual result and any uncertainty.", "Uncertainty remains visible for review.")
    ],
    expectedResult: `${area.name} behaves consistently with the available evidence or gaps are recorded.`
  });
}

function buildLinkedKnowledgeReviewDraft(
  workItem: WorkItemDetail,
  analysis: StoryRequirementAnalysis,
  usableLinkedEvidence: StoryRequirementAnalysis["linkedKnowledgeEvidence"]
): TestCaseDraft {
  return draft({
    id: draftId(workItem, "linked-knowledge"),
    title: "Review linked board knowledge evidence",
    objective: "Confirm selected board knowledge evidence applies to this specific work item.",
    testType: "review",
    priority: "medium",
    certainty: "needs-confirmation",
    status: "needs-review",
    evidenceLinks: ensureEvidenceLinks(usableLinkedEvidence.slice(0, 4).map((item) => ({
      id: item.id,
      label: item.title,
      source: "linked-knowledge",
      excerpt: truncate(item.textPreview ?? item.evidenceLabel, 140),
      certainty: item.certainty
    }))),
    warnings: [
      warning("LINKED_EVIDENCE_LIMITED", "Linked board knowledge is selected context only and may be metadata-only or capped preview text.")
    ],
    sourceSummary: "Generated because linked knowledge evidence was explicitly selected for draft generation.",
    steps: [
      step(1, "Review each linked evidence item and limitation.", "Linked evidence limitations are understood."),
      step(2, "Confirm the evidence applies to this work item.", "Evidence applicability is confirmed or rejected."),
      step(3, "Use confirmed evidence to refine final test scope later.", "Only confirmed evidence informs final test cases.")
    ],
    expectedResult: "Linked evidence applicability is confirmed before final test cases are approved."
  });
}

function buildRegressionDraft(
  workItem: WorkItemDetail,
  analysis: StoryRequirementAnalysis,
  blockedBy: string[]
): TestCaseDraft {
  return draft({
    id: draftId(workItem, "regression"),
    title: "Run focused regression around changed behavior",
    objective: "Check nearby behavior without claiming full regression coverage.",
    testType: "regression",
    priority: analysis.risks.some((risk) => risk.severity === "high") ? "high" : "medium",
    certainty: "needs-confirmation",
    status: statusFor(blockedBy, "needs-review"),
    evidenceLinks: [
      evidenceLink("work-item-type", "Work item type", workItem.workItemType, "source-backed"),
      evidenceLink("analysis", "Regression signal", "Likely test areas and risks from Story analysis.", "needs-confirmation")
    ],
    warnings: warningsForAnalysis(analysis, blockedBy),
    sourceSummary: "Generated as a focused regression draft from analysis risks and work item type.",
    steps: [
      step(1, "Identify the behavior adjacent to the described change.", "Nearby behavior is selected from available evidence or confirmed by QA."),
      step(2, "Perform the main changed workflow once.", "The changed workflow still behaves as expected."),
      step(3, "Perform one adjacent regression check.", "No obvious nearby regression is observed."),
      step(4, "Record any unconfirmed regression scope.", "Open regression scope remains visible.")
    ],
    expectedResult: "Focused regression checks pass or uncertainty is recorded for review."
  });
}

function draft(input: Omit<TestCaseDraft, "preconditions"> & { preconditions?: string[] }): TestCaseDraft {
  return {
    ...input,
    preconditions: input.preconditions ?? [
      "QA has reviewed the fetched work item evidence.",
      "Open assumptions and needs-confirmation items remain visible."
    ]
  };
}

function getBlockingReasons(analysis: StoryRequirementAnalysis): string[] {
  return analysis.gaps
    .filter((gap) => gap.severity === "high")
    .map((gap) => gap.text);
}

function statusFor(blockedBy: string[], fallback: TestCaseDraftStatus): TestCaseDraftStatus {
  return blockedBy.length > 0 ? "blocked-by-gaps" : fallback;
}

function warningsForAnalysis(analysis: StoryRequirementAnalysis, blockedBy: string[]): TestCaseDraftWarning[] {
  const warnings: TestCaseDraftWarning[] = [warning("DRAFT_ONLY", TEST_CASE_DRAFT_DISCLAIMER)];

  if (analysis.acceptanceCriteriaStatus === "missing") {
    warnings.push(warning("MISSING_ACCEPTANCE_CRITERIA", "Acceptance criteria is missing; drafts cannot be treated as final."));
  } else if (analysis.acceptanceCriteriaStatus === "weak") {
    warnings.push(warning("WEAK_EVIDENCE", "Acceptance criteria appears weak; QA should confirm expected behavior."));
  }

  if (blockedBy.length > 0) {
    warnings.push(warning("BLOCKED_BY_GAPS", "High severity analysis gaps must be reviewed before final cases are approved."));
  }

  if (analysis.needsConfirmation.length > 0) {
    warnings.push(warning("NEEDS_CONFIRMATION", "Story analysis contains needs-confirmation items."));
  }

  return warnings;
}

function buildSuiteWarnings(analysis: StoryRequirementAnalysis, blockedBy: string[]): TestCaseDraftWarning[] {
  return warningsForAnalysis(analysis, blockedBy);
}

function buildCoverageSummary(draftCases: TestCaseDraft[], analysis: StoryRequirementAnalysis): string {
  return `${draftCases.length} draft case${draftCases.length === 1 ? "" : "s"} generated from ${analysis.evidence.length} work item evidence link${analysis.evidence.length === 1 ? "" : "s"} and ${analysis.linkedKnowledgeEvidence.length} linked knowledge item${analysis.linkedKnowledgeEvidence.length === 1 ? "" : "s"}.`;
}

function getUsableLinkedEvidence(
  analysis: StoryRequirementAnalysis,
  selectedInputs: Required<TestCaseDraftSelectedInputs>
): StoryRequirementAnalysis["linkedKnowledgeEvidence"] {
  if (!selectedInputs.includeLinkedKnowledge) {
    return [];
  }

  return analysis.linkedKnowledgeEvidence.filter((item) => {
    if (item.kind === "user-confirmed-note") {
      return selectedInputs.includeUserConfirmedNotes;
    }

    return true;
  });
}

function ensureEvidenceLinks(evidenceLinks: TestCaseDraftEvidenceLink[]): TestCaseDraftEvidenceLink[];
function ensureEvidenceLinks(draftCase: TestCaseDraft): TestCaseDraft;
function ensureEvidenceLinks(value: TestCaseDraft | TestCaseDraftEvidenceLink[]): TestCaseDraft | TestCaseDraftEvidenceLink[] {
  if (Array.isArray(value)) {
    return value.length > 0 ? value : [fallbackAnalysisEvidenceLink()];
  }

  return value.evidenceLinks.length > 0
    ? value
    : {
        ...value,
        evidenceLinks: [fallbackAnalysisEvidenceLink()]
      };
}

function fallbackAnalysisEvidenceLink(): TestCaseDraftEvidenceLink {
  return evidenceLink(
    "analysis",
    "Story analysis",
    "Draft generated from deterministic Story analysis output.",
    "needs-confirmation"
  );
}

function evidenceLink(
  source: TestCaseDraftEvidenceLink["source"],
  label: string,
  excerpt: string | undefined,
  certainty: TestCaseDraftCertainty
): TestCaseDraftEvidenceLink {
  return {
    id: `${source}-${slug(label)}`,
    source,
    label,
    excerpt: excerpt ? truncate(excerpt, 140) : undefined,
    certainty
  };
}

function step(order: number, action: string, expectedResult: string) {
  return { order, action, expectedResult };
}

function warning(code: TestCaseDraftWarning["code"], message: string): TestCaseDraftWarning {
  return { code, message };
}

function draftId(workItem: WorkItemDetail, suffix: string): string {
  return `draft-${workItem.workItemId}-${suffix}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "evidence";
}

function truncate(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

import type {
  StoryAnalysisEvidence,
  StoryLinkedKnowledgeEvidence,
  StoryRequirementAnalysis,
  StoryRequirementAnalysisCertainty,
  StoryRequirementAnalysisSeverity,
  StoryRequirementGap,
  StoryRequirementQuestion,
  StoryRiskNote,
  StoryTestArea,
  WorkItemDetail
} from "@qa-assist/shared";
import { DETERMINISTIC_STORY_ANALYSIS_DISCLAIMER } from "./storyRequirementAnalysisPrompt.js";

const WEAK_TEXT_LENGTH = 80;
const VAGUE_TITLE_WORDS = ["update", "fix", "improve", "changes", "misc", "support"];

export function generateDeterministicStoryRequirementAnalysis(
  workItem: WorkItemDetail,
  linkedKnowledgeEvidence: StoryLinkedKnowledgeEvidence[] = []
): StoryRequirementAnalysis {
  const descriptionStatus = getTextStatus(workItem.descriptionText);
  const acceptanceCriteriaStatus = getAcceptanceCriteriaStatus(workItem);
  const evidence = collectEvidence(workItem);
  const gaps = buildGaps(workItem, descriptionStatus, acceptanceCriteriaStatus);
  const questionsForBAOrPO = buildQuestions(workItem, descriptionStatus, acceptanceCriteriaStatus);
  const likelyTestAreas = buildLikelyTestAreas(workItem, acceptanceCriteriaStatus, linkedKnowledgeEvidence);
  const risks = buildRisks(workItem, descriptionStatus, acceptanceCriteriaStatus);
  const assumptions = buildAssumptions(workItem, linkedKnowledgeEvidence);
  const needsConfirmation = buildNeedsConfirmation(workItem, gaps, questionsForBAOrPO, linkedKnowledgeEvidence);
  const evidenceCoverage = buildEvidenceCoverage(evidence, linkedKnowledgeEvidence);

  return {
    mode: "deterministic-preview",
    generatedAt: new Date().toISOString(),
    workItemId: workItem.workItemId,
    title: workItem.title,
    workItemType: workItem.workItemType,
    headline: buildHeadline(descriptionStatus, acceptanceCriteriaStatus, gaps),
    requirementSummary: buildSummary(workItem, descriptionStatus, acceptanceCriteriaStatus, linkedKnowledgeEvidence),
    acceptanceCriteriaStatus,
    descriptionStatus,
    gaps,
    questionsForBAOrPO,
    likelyTestAreas,
    risks,
    assumptions,
    needsConfirmation,
    evidence,
    linkedKnowledgeEvidence,
    evidenceCoverage,
    confidence: calculateConfidence(descriptionStatus, acceptanceCriteriaStatus, gaps),
    disclaimer: DETERMINISTIC_STORY_ANALYSIS_DISCLAIMER
  };
}

function buildHeadline(
  descriptionStatus: "present" | "missing" | "weak",
  acceptanceCriteriaStatus: StoryRequirementAnalysis["acceptanceCriteriaStatus"],
  gaps: StoryRequirementGap[]
): string {
  if (gaps.some((gap) => gap.severity === "high")) {
    return "Requirement evidence needs clarification before test design.";
  }

  if (descriptionStatus === "present" && (acceptanceCriteriaStatus === "present" || acceptanceCriteriaStatus === "not-applicable")) {
    return "Core requirement evidence is available for QA review.";
  }

  return "Requirement evidence is partially available and needs QA confirmation.";
}

function buildSummary(
  workItem: WorkItemDetail,
  descriptionStatus: "present" | "missing" | "weak",
  acceptanceCriteriaStatus: StoryRequirementAnalysis["acceptanceCriteriaStatus"],
  linkedKnowledgeEvidence: StoryLinkedKnowledgeEvidence[]
): StoryRequirementAnalysis["requirementSummary"] {
  const evidence = [
    evidenceItem("title", "Work item title", workItem.title),
    evidenceItem("work-item-type", "Work item type", workItem.workItemType),
    ...(workItem.descriptionText ? [evidenceItem("description", "Description text", workItem.descriptionText)] : [])
  ];

  return {
    text: `This ${workItem.workItemType} is titled "${truncate(workItem.title, 96)}". Description is ${descriptionStatus}; acceptance criteria is ${acceptanceCriteriaStatus}. ${buildLinkedEvidenceSummarySentence(linkedKnowledgeEvidence)}`,
    certainty: "source-backed",
    evidence
  };
}

function buildGaps(
  workItem: WorkItemDetail,
  descriptionStatus: "present" | "missing" | "weak",
  acceptanceCriteriaStatus: StoryRequirementAnalysis["acceptanceCriteriaStatus"]
): StoryRequirementGap[] {
  const gaps: StoryRequirementGap[] = [];

  if (descriptionStatus === "missing") {
    gaps.push(gap("Description is missing, so expected behavior and scope may be unclear.", "high", "source-backed", [
      evidenceItem("description", "Description field was not returned")
    ]));
  } else if (descriptionStatus === "weak") {
    gaps.push(gap("Description is very short and may not explain enough behavior for confident testing.", "medium", "source-backed", [
      evidenceItem("description", "Short description", workItem.descriptionText)
    ]));
  }

  if (acceptanceCriteriaStatus === "missing") {
    gaps.push(gap("Acceptance criteria is missing for this work item type.", "high", "source-backed", [
      evidenceItem("acceptance-criteria", "Acceptance criteria field was not returned")
    ]));
  } else if (acceptanceCriteriaStatus === "weak") {
    gaps.push(gap("Acceptance criteria appears too short or vague to define done/testable behavior.", "medium", "source-backed", [
      evidenceItem("acceptance-criteria", "Short acceptance criteria", workItem.acceptanceCriteriaText)
    ]));
  }

  if (hasVagueTitle(workItem.title) && (descriptionStatus !== "present" || acceptanceCriteriaStatus === "missing" || acceptanceCriteriaStatus === "weak")) {
    gaps.push(gap("Title uses broad wording while supporting requirement evidence is weak.", "medium", "needs-confirmation", [
      evidenceItem("title", "Potentially vague title", workItem.title)
    ]));
  }

  if (workItem.relations.length === 0) {
    gaps.push(gap("No relation links were returned; traceability to parent, test case, or related work may need review.", "low", "needs-confirmation", [
      evidenceItem("relations", "No relations returned")
    ]));
  }

  return gaps;
}

function buildQuestions(
  workItem: WorkItemDetail,
  descriptionStatus: "present" | "missing" | "weak",
  acceptanceCriteriaStatus: StoryRequirementAnalysis["acceptanceCriteriaStatus"]
): StoryRequirementQuestion[] {
  const questions: StoryRequirementQuestion[] = [];

  if (workItem.workItemType === "bug") {
    questions.push(question("What are the exact repro steps, expected result, actual result, and affected environment?", "high", [
      evidenceItem("work-item-type", "Bug work item", workItem.workItemType)
    ]));
    questions.push(question("Which regression areas should be retested after the fix?", "medium", [
      evidenceItem("work-item-type", "Bug work item", workItem.workItemType)
    ]));
  }

  if (descriptionStatus !== "present") {
    questions.push(question("What user behavior, business rule, or workflow should QA verify?", "high", [
      evidenceItem("description", "Description is not strong enough")
    ]));
  }

  if (acceptanceCriteriaStatus === "missing" || acceptanceCriteriaStatus === "weak") {
    questions.push(question("What acceptance criteria must pass before this work item can move forward?", "high", [
      evidenceItem("acceptance-criteria", "Acceptance criteria needs confirmation")
    ]));
  }

  if (workItem.priority === undefined && workItem.severity === undefined && workItem.storyPoints === undefined) {
    questions.push(question("Should QA treat this as high priority, high risk, or large scope?", "medium", [
      evidenceItem("priority", "Priority/severity/story points were not returned")
    ]));
  }

  return questions;
}

function buildLikelyTestAreas(
  workItem: WorkItemDetail,
  acceptanceCriteriaStatus: StoryRequirementAnalysis["acceptanceCriteriaStatus"],
  linkedKnowledgeEvidence: StoryLinkedKnowledgeEvidence[]
): StoryTestArea[] {
  const text = searchableText(workItem);
  const areas: StoryTestArea[] = [
    testArea("Acceptance criteria coverage", "Verify each returned acceptance criterion or confirm missing criteria before scope approval.", "source-backed", [
      evidenceItem("acceptance-criteria", "Acceptance criteria status", acceptanceCriteriaStatus)
    ]),
    testArea("Regression around changed flow", "Review nearby behavior because the work item represents a product change.", "needs-confirmation", [
      evidenceItem("work-item-type", "Work item type", workItem.workItemType)
    ])
  ];

  if (acceptanceCriteriaStatus === "missing" || acceptanceCriteriaStatus === "weak") {
    areas.push(testArea("Negative/error handling", "Weak or missing acceptance criteria usually needs explicit negative-path confirmation.", "needs-confirmation", [
      evidenceItem("acceptance-criteria", "Acceptance criteria is not strong")
    ]));
  }

  addAreaIfTextMatches(areas, text, ["role", "user", "permission"], "Permission/role impact", "Requirement text mentions user, role, or permission.");
  addAreaIfTextMatches(areas, text, ["form", "input", "field", "validation"], "Data validation", "Requirement text mentions form, input, field, or validation.");
  addAreaIfTextMatches(areas, text, ["api", "integration", "service"], "Integration/API", "Requirement text mentions API, integration, or service behavior.");
  addAreaIfTextMatches(areas, text, ["ui", "page", "screen", "button"], "UI/browser", "Requirement text mentions UI, page, screen, or button behavior.");
  addLinkedEvidenceTestAreas(areas, linkedKnowledgeEvidence);

  return areas;
}

function buildRisks(
  workItem: WorkItemDetail,
  descriptionStatus: "present" | "missing" | "weak",
  acceptanceCriteriaStatus: StoryRequirementAnalysis["acceptanceCriteriaStatus"]
): StoryRiskNote[] {
  const risks: StoryRiskNote[] = [];

  if (descriptionStatus !== "present" || acceptanceCriteriaStatus === "missing" || acceptanceCriteriaStatus === "weak") {
    risks.push(risk("Testing from incomplete requirement evidence may miss edge cases or expected behavior.", "high", "needs-confirmation", [
      evidenceItem("description", "Description status", descriptionStatus),
      evidenceItem("acceptance-criteria", "Acceptance criteria status", acceptanceCriteriaStatus)
    ]));
  }

  if (workItem.workItemType === "bug") {
    risks.push(risk("Bug fixes need regression review around the changed behavior and previously failing path.", "medium", "needs-confirmation", [
      evidenceItem("work-item-type", "Bug work item", workItem.workItemType)
    ]));
  }

  return risks;
}

function buildAssumptions(workItem: WorkItemDetail, linkedKnowledgeEvidence: StoryLinkedKnowledgeEvidence[]): string[] {
  const assumptions = [
    linkedKnowledgeEvidence.length > 0
      ? "Linked board knowledge evidence was selected by the user and is not automatically indexed."
      : "Only fetched work item detail was used; comments, attachments, and board knowledge are not included.",
    "This preview does not validate business intent beyond the returned fields."
  ];

  if (workItem.relations.length === 0) {
    assumptions.push("No relation links were returned by the work item detail response.");
  }

  return assumptions;
}

function buildNeedsConfirmation(
  workItem: WorkItemDetail,
  gaps: StoryRequirementGap[],
  questions: StoryRequirementQuestion[],
  linkedKnowledgeEvidence: StoryLinkedKnowledgeEvidence[]
): string[] {
  return [
    "Confirm requirement intent with QA/BA/PO before finalizing scope.",
    "Confirm whether the listed gaps are true blockers or acceptable for this work item.",
    "Confirm test areas before creating final test cases.",
    ...(linkedKnowledgeEvidence.length > 0 ? ["Confirm linked board knowledge evidence applies to this specific work item."] : []),
    ...(gaps.length > 0 ? ["Review all gap items before approving test design."] : []),
    ...(questions.length > 0 ? ["Answer open BA/PO questions before treating analysis as complete."] : []),
    ...(workItem.priority === undefined && workItem.severity === undefined && workItem.storyPoints === undefined
      ? ["Confirm priority, severity, or scope sizing if it affects QA order."]
      : [])
  ];
}

function buildLinkedEvidenceSummarySentence(linkedKnowledgeEvidence: StoryLinkedKnowledgeEvidence[]): string {
  if (linkedKnowledgeEvidence.length === 0) {
    return "No board knowledge evidence was linked to this analysis.";
  }

  return `User selected ${linkedKnowledgeEvidence.length} board knowledge evidence item${linkedKnowledgeEvidence.length === 1 ? "" : "s"} for context.`;
}

function addLinkedEvidenceTestAreas(areas: StoryTestArea[], linkedKnowledgeEvidence: StoryLinkedKnowledgeEvidence[]): void {
  const previewText = linkedKnowledgeEvidence
    .map((item) => item.textPreview ?? "")
    .join(" ")
    .toLowerCase();

  addLinkedAreaIfTextMatches(areas, previewText, ["role", "user", "permission"], "Permission/role impact", "Linked preview text mentions user, role, or permission.");
  addLinkedAreaIfTextMatches(areas, previewText, ["form", "input", "field", "validation"], "Data validation", "Linked preview text mentions form, input, field, or validation.");
  addLinkedAreaIfTextMatches(areas, previewText, ["api", "integration", "service"], "Integration/API", "Linked preview text mentions API, integration, or service behavior.");
  addLinkedAreaIfTextMatches(areas, previewText, ["ui", "page", "screen", "button"], "UI/browser", "Linked preview text mentions UI, page, screen, or button behavior.");
}

function addLinkedAreaIfTextMatches(areas: StoryTestArea[], text: string, words: string[], name: string, reason: string): void {
  if (words.some((word) => text.includes(word))) {
    areas.push(testArea(name, reason, "needs-confirmation", [
      evidenceItem("linked-knowledge", "Matched linked knowledge preview", words.find((word) => text.includes(word)) ?? name)
    ]));
  }
}

function buildEvidenceCoverage(
  workItemEvidence: StoryAnalysisEvidence[],
  linkedKnowledgeEvidence: StoryLinkedKnowledgeEvidence[]
): StoryRequirementAnalysis["evidenceCoverage"] {
  return {
    workItemEvidenceCount: workItemEvidence.length,
    linkedKnowledgeEvidenceCount: linkedKnowledgeEvidence.length,
    includedEvidenceKinds: Array.from(new Set(linkedKnowledgeEvidence.map((item) => item.kind))),
    warnings: buildLinkedEvidenceWarnings(linkedKnowledgeEvidence)
  };
}

function buildLinkedEvidenceWarnings(linkedKnowledgeEvidence: StoryLinkedKnowledgeEvidence[]): string[] {
  if (linkedKnowledgeEvidence.length === 0) {
    return ["No board knowledge evidence linked to this analysis."];
  }

  return linkedKnowledgeEvidence.flatMap((item) => {
    const warnings: string[] = [];

    if (item.kind === "board-knowledge-metadata" && !item.textPreview) {
      warnings.push("Metadata-only source selected; content has not been extracted or analyzed.");
    }

    if (item.kind === "extracted-text-preview" && item.textPreview) {
      warnings.push("Only extracted preview text is included; full document is not included.");
    }

    return warnings;
  });
}

function collectEvidence(workItem: WorkItemDetail): StoryAnalysisEvidence[] {
  return [
    evidenceItem("title", "Title", workItem.title),
    evidenceItem("work-item-type", "Work item type", workItem.workItemType),
    ...(workItem.state ? [evidenceItem("state", "State", workItem.state)] : []),
    ...(workItem.descriptionText ? [evidenceItem("description", "Description", workItem.descriptionText)] : []),
    ...(workItem.acceptanceCriteriaText ? [evidenceItem("acceptance-criteria", "Acceptance criteria", workItem.acceptanceCriteriaText)] : []),
    ...(workItem.tags.length > 0 ? [evidenceItem("tags", "Tags", workItem.tags.join(", "))] : []),
    ...(workItem.priority !== undefined ? [evidenceItem("priority", "Priority", String(workItem.priority))] : []),
    ...(workItem.severity ? [evidenceItem("severity", "Severity", workItem.severity)] : []),
    ...(workItem.storyPoints !== undefined ? [evidenceItem("story-points", "Story points", String(workItem.storyPoints))] : []),
    evidenceItem("relations", "Relation count", String(workItem.relations.length)),
    ...(workItem.areaPath ? [evidenceItem("area-path", "Area path", workItem.areaPath)] : []),
    ...(workItem.iterationPath ? [evidenceItem("iteration-path", "Iteration path", workItem.iterationPath)] : []),
    evidenceItem("metadata", "Fetched from source", workItem.evidence.sourceDescription)
  ];
}

function getTextStatus(value: string | undefined): "present" | "missing" | "weak" {
  if (!value?.trim()) {
    return "missing";
  }

  return value.trim().length < WEAK_TEXT_LENGTH ? "weak" : "present";
}

function getAcceptanceCriteriaStatus(workItem: WorkItemDetail): StoryRequirementAnalysis["acceptanceCriteriaStatus"] {
  if (workItem.workItemType === "bug" || workItem.workItemType === "task") {
    return workItem.acceptanceCriteriaText?.trim() ? getTextStatus(workItem.acceptanceCriteriaText) : "not-applicable";
  }

  return getTextStatus(workItem.acceptanceCriteriaText);
}

function hasVagueTitle(title: string): boolean {
  const normalized = title.toLowerCase();
  return VAGUE_TITLE_WORDS.some((word) => normalized.includes(word));
}

function searchableText(workItem: WorkItemDetail): string {
  return [
    workItem.title,
    workItem.descriptionText,
    workItem.acceptanceCriteriaText,
    workItem.tags.join(" ")
  ].filter(Boolean).join(" ").toLowerCase();
}

function addAreaIfTextMatches(areas: StoryTestArea[], text: string, words: string[], name: string, reason: string): void {
  if (words.some((word) => text.includes(word))) {
    areas.push(testArea(name, reason, "source-backed", [
      evidenceItem("description", "Matched requirement text", words.find((word) => text.includes(word)) ?? name)
    ]));
  }
}

function gap(
  text: string,
  severity: StoryRequirementAnalysisSeverity,
  certainty: StoryRequirementAnalysisCertainty,
  evidence: StoryAnalysisEvidence[]
): StoryRequirementGap {
  return { text, severity, certainty, evidence };
}

function question(text: string, severity: StoryRequirementAnalysisSeverity, evidence: StoryAnalysisEvidence[]): StoryRequirementQuestion {
  return { text, severity, certainty: "needs-confirmation", evidence };
}

function testArea(
  name: string,
  reason: string,
  certainty: StoryRequirementAnalysisCertainty,
  evidence: StoryAnalysisEvidence[]
): StoryTestArea {
  return { name, reason, certainty, evidence };
}

function risk(
  text: string,
  severity: StoryRequirementAnalysisSeverity,
  certainty: StoryRequirementAnalysisCertainty,
  evidence: StoryAnalysisEvidence[]
): StoryRiskNote {
  return { text, severity, certainty, evidence };
}

function evidenceItem(source: StoryAnalysisEvidence["source"], label: string, excerpt?: string): StoryAnalysisEvidence {
  return {
    source,
    label,
    excerpt: excerpt ? truncate(excerpt, 160) : undefined
  };
}

function calculateConfidence(
  descriptionStatus: "present" | "missing" | "weak",
  acceptanceCriteriaStatus: StoryRequirementAnalysis["acceptanceCriteriaStatus"],
  gaps: StoryRequirementGap[]
): "low" | "medium" | "high" {
  if (gaps.some((gap) => gap.severity === "high") || descriptionStatus === "missing" || acceptanceCriteriaStatus === "missing") {
    return "low";
  }

  if (descriptionStatus === "present" && (acceptanceCriteriaStatus === "present" || acceptanceCriteriaStatus === "not-applicable")) {
    return "high";
  }

  return "medium";
}

function truncate(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

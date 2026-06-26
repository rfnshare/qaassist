import type { IsoDateTimeString } from "../common/timestamps.js";
import type {
  StoryAnalysisEvidence,
  StoryLinkedKnowledgeEvidence,
  StoryRequirementAnalysis,
  StoryRequirementAnalysisCertainty
} from "../analysis/storyRequirementAnalysis.js";
import type { WorkItemDetail } from "../work-items/workItemDetail.js";

export type TestCaseDraftGenerationMode =
  | "deterministic-preview"
  | "llm-assisted"
  | "disabled";

export type TestCaseDraftStatus =
  | "draft"
  | "needs-review"
  | "blocked-by-gaps";

export type TestCaseDraftCertainty = StoryRequirementAnalysisCertainty;

export type TestCaseDraftPriority =
  | "low"
  | "medium"
  | "high";

export type TestCaseDraftEvidenceLink = {
  id: string;
  label: string;
  source: StoryAnalysisEvidence["source"] | "linked-knowledge" | "analysis";
  excerpt?: string;
  certainty: TestCaseDraftCertainty;
};

export type TestCaseDraftWarning = {
  code:
    | "DRAFT_ONLY"
    | "WEAK_EVIDENCE"
    | "MISSING_ACCEPTANCE_CRITERIA"
    | "BLOCKED_BY_GAPS"
    | "NEEDS_CONFIRMATION"
    | "LINKED_EVIDENCE_LIMITED";
  message: string;
};

export type TestCaseDraftStep = {
  order: number;
  action: string;
  expectedResult: string;
};

export type TestCaseDraft = {
  id: string;
  title: string;
  objective: string;
  preconditions: string[];
  steps: TestCaseDraftStep[];
  expectedResult: string;
  testType: "positive" | "negative" | "regression" | "review" | "bug-verification";
  priority: TestCaseDraftPriority;
  certainty: TestCaseDraftCertainty;
  evidenceLinks: TestCaseDraftEvidenceLink[];
  warnings: TestCaseDraftWarning[];
  sourceSummary: string;
  status: TestCaseDraftStatus;
};

export type TestCaseDraftSuite = {
  generatedAt: IsoDateTimeString;
  workItemId: number;
  workItemTitle: string;
  mode: TestCaseDraftGenerationMode;
  draftCases: TestCaseDraft[];
  blockedBy: string[];
  assumptions: string[];
  needsConfirmation: string[];
  coverageSummary: string;
  warnings: TestCaseDraftWarning[];
  disclaimer: string;
};

export type TestCaseDraftSelectedInputs = {
  includePositivePath?: boolean;
  includeNegativePath?: boolean;
  includeRegression?: boolean;
  includeLinkedKnowledge?: boolean;
  includeUserConfirmedNotes?: boolean;
};

export type TestCaseDraftGenerationRequest = {
  workItem: WorkItemDetail;
  analysis: StoryRequirementAnalysis;
  selectedDraftInputs?: TestCaseDraftSelectedInputs;
};

export type TestCaseDraftGenerationResult = TestCaseDraftSuite & {
  linkedKnowledgeEvidenceUsed: StoryLinkedKnowledgeEvidence[];
};

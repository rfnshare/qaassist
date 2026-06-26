import type { IsoDateTimeString } from "../common/timestamps.js";
import type {
  BoardKnowledgeSourceStatus,
  BoardKnowledgeSourceType,
  BoardKnowledgeTrustLevel
} from "../knowledge/boardKnowledge.js";
import type { WorkItemDetail } from "../work-items/workItemDetail.js";
import type { WorkItemType } from "../work-items/workItemContext.js";

export type StoryRequirementAnalysisMode =
  | "deterministic-preview"
  | "llm-assisted"
  | "disabled";

export type StoryRequirementAnalysisCertainty =
  | "source-backed"
  | "user-confirmed"
  | "assumption"
  | "needs-confirmation";

export type StoryRequirementAnalysisStatus =
  | "present"
  | "missing"
  | "weak"
  | "not-applicable";

export type StoryRequirementAnalysisSeverity = "low" | "medium" | "high";

export type StoryAnalysisEvidence = {
  source:
    | "title"
    | "work-item-type"
    | "state"
    | "description"
    | "acceptance-criteria"
    | "tags"
    | "priority"
    | "severity"
    | "story-points"
    | "relations"
    | "area-path"
    | "iteration-path"
    | "metadata"
    | "linked-knowledge";
  label: string;
  excerpt?: string;
};

export type StoryLinkedKnowledgeEvidenceKind =
  | "board-knowledge-metadata"
  | "extracted-text-preview"
  | "user-confirmed-note";

export type StoryLinkedKnowledgeEvidence = {
  id: string;
  kind: StoryLinkedKnowledgeEvidenceKind;
  title: string;
  sourceType?: BoardKnowledgeSourceType;
  status?: BoardKnowledgeSourceStatus;
  trustLevel?: BoardKnowledgeTrustLevel;
  textPreview?: string;
  fileName?: string;
  evidenceLabel: string;
  selectedByUser: boolean;
  limitations: string[];
  certainty: StoryRequirementAnalysisCertainty;
};

export type StoryRequirementAnalysisEvidenceCoverage = {
  workItemEvidenceCount: number;
  linkedKnowledgeEvidenceCount: number;
  includedEvidenceKinds: StoryLinkedKnowledgeEvidenceKind[];
  warnings: string[];
};

export type StoryRequirementAnalysisRequest = {
  workItem: WorkItemDetail;
  linkedKnowledgeEvidence?: StoryLinkedKnowledgeEvidence[];
};

export type StoryRequirementSummary = {
  text: string;
  certainty: StoryRequirementAnalysisCertainty;
  evidence: StoryAnalysisEvidence[];
};

export type StoryRequirementGap = {
  text: string;
  severity: StoryRequirementAnalysisSeverity;
  certainty: StoryRequirementAnalysisCertainty;
  evidence: StoryAnalysisEvidence[];
};

export type StoryRequirementQuestion = {
  text: string;
  severity: StoryRequirementAnalysisSeverity;
  certainty: StoryRequirementAnalysisCertainty;
  evidence: StoryAnalysisEvidence[];
};

export type StoryTestArea = {
  name: string;
  reason: string;
  certainty: StoryRequirementAnalysisCertainty;
  evidence: StoryAnalysisEvidence[];
};

export type StoryRiskNote = {
  text: string;
  severity: StoryRequirementAnalysisSeverity;
  certainty: StoryRequirementAnalysisCertainty;
  evidence: StoryAnalysisEvidence[];
};

export type StoryRequirementAnalysis = {
  mode: StoryRequirementAnalysisMode;
  generatedAt: IsoDateTimeString;
  workItemId: number;
  title: string;
  workItemType: WorkItemType;
  headline: string;
  requirementSummary: StoryRequirementSummary;
  acceptanceCriteriaStatus: StoryRequirementAnalysisStatus;
  descriptionStatus: Exclude<StoryRequirementAnalysisStatus, "not-applicable">;
  gaps: StoryRequirementGap[];
  questionsForBAOrPO: StoryRequirementQuestion[];
  likelyTestAreas: StoryTestArea[];
  risks: StoryRiskNote[];
  assumptions: string[];
  needsConfirmation: string[];
  evidence: StoryAnalysisEvidence[];
  linkedKnowledgeEvidence: StoryLinkedKnowledgeEvidence[];
  evidenceCoverage: StoryRequirementAnalysisEvidenceCoverage;
  confidence: "low" | "medium" | "high";
  disclaimer: string;
};

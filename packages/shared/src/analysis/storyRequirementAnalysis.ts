import type { IsoDateTimeString } from "../common/timestamps.js";
import type { WorkItemType } from "../work-items/workItemContext.js";

export type StoryRequirementAnalysisMode =
  | "deterministic-preview"
  | "llm-assisted"
  | "disabled";

export type StoryRequirementAnalysisCertainty =
  | "source-backed"
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
    | "metadata";
  label: string;
  excerpt?: string;
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
  confidence: "low" | "medium" | "high";
  disclaimer: string;
};

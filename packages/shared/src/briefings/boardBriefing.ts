import type { IsoDateTimeString } from "../common/timestamps.js";
import type { BoardScope } from "../settings/azureDevOpsSettings.js";

export type BoardBriefingMode =
  | "deterministic-preview"
  | "llm-assisted"
  | "disabled";

export type BoardBriefingCertainty =
  | "source-backed"
  | "assumption"
  | "needs-confirmation";

export type BoardBriefingEvidence = {
  source: "board-summary" | "work-queue" | "recommendation";
  label: string;
  workItemId?: string | number;
  title?: string;
  state?: string;
};

export type BoardBriefingInsight = {
  text: string;
  certainty: BoardBriefingCertainty;
  evidence: BoardBriefingEvidence[];
};

export type BoardBriefingAction = {
  label: string;
  reason: string;
  needsConfirmation: boolean;
  evidence: BoardBriefingEvidence[];
};

export type BoardBriefingRisk = {
  text: string;
  severity: "low" | "medium" | "high";
  certainty: BoardBriefingCertainty;
  evidence: BoardBriefingEvidence[];
};

export type BoardBriefingSection = {
  title: string;
  insights: BoardBriefingInsight[];
};

export type BoardBriefing = {
  mode: BoardBriefingMode;
  generatedAt: IsoDateTimeString;
  selectedBoard: BoardScope;
  selectedTeamLabel: string;
  headline: string;
  summary: string;
  changedOrImportant: BoardBriefingSection;
  readyToRetest: BoardBriefingSection;
  myQaWork: BoardBriefingSection;
  suggestedNextWork?: BoardBriefingAction;
  risksAndGaps: BoardBriefingRisk[];
  assumptions: string[];
  needsConfirmation: string[];
  evidence: BoardBriefingEvidence[];
  confidence: "low" | "medium" | "high";
  disclaimer: string;
};

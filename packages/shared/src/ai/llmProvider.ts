import type { StoryRequirementAnalysis, StoryRequirementAnalysisCertainty } from "../analysis/storyRequirementAnalysis.js";
import type { WorkItemDetail } from "../work-items/workItemDetail.js";

export type LlmProviderName =
  | "openai"
  | "azure-openai"
  | "disabled";

export type LlmMode =
  | "deterministic-preview"
  | "llm-assisted"
  | "disabled";

export type LlmAvailabilityStatus =
  | "available"
  | "misconfigured"
  | "disabled";

export type LlmUsageLabel =
  | "backend-only"
  | "suggestion-only"
  | "requires-qa-review";

export type LlmProviderConfigurationSummary = {
  provider: LlmProviderName;
  availability: LlmAvailabilityStatus;
  model?: string;
  baseUrlConfigured: boolean;
  apiKeyConfigured: boolean;
  reason?: string;
  disclaimer: string;
};

export type AiAssistanceModeSummary = {
  mode: LlmMode;
  provider: LlmProviderConfigurationSummary;
  usageLabels: LlmUsageLabel[];
  deterministicDefault: boolean;
  disclaimer: string;
};

export type StoryAnalysisAssistRequest = {
  workItem: WorkItemDetail;
  deterministicAnalysis: StoryRequirementAnalysis;
};

export type StoryAnalysisAssistSuggestion = {
  text: string;
  certainty: StoryRequirementAnalysisCertainty;
};

export type StoryAnalysisAssistResult = {
  mode: Extract<LlmMode, "llm-assisted">;
  generatedAt: string;
  provider: LlmProviderConfigurationSummary;
  suggestedRequirementSummary: StoryAnalysisAssistSuggestion;
  suggestedGapsOrQuestions: StoryAnalysisAssistSuggestion[];
  suggestedLikelyTestAreas: StoryAnalysisAssistSuggestion[];
  warnings: string[];
  disclaimer: string;
};

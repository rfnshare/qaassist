import type { IsoDateTimeString } from "../common/timestamps.js";
import type { LlmMode, LlmProviderConfigurationSummary } from "./llmProvider.js";

export type AiRefinementTarget =
  | "story-analysis"
  | "draft-test-cases"
  | "automation-candidates"
  | "writeback-helper";

export type AiRefinementProviderSummary = Pick<
  LlmProviderConfigurationSummary,
  "provider" | "availability" | "model" | "baseUrlConfigured" | "apiKeyConfigured"
>;

export type AiSuggestedEdit = {
  field: string;
  suggestion: string;
  reason?: string;
};

export type AiRefinementSection = {
  title: string;
  summary: string;
  bullets: string[];
  suggestedEdits: AiSuggestedEdit[];
  confidenceNotes: string[];
};

export type AiRefinementWarning = {
  code:
    | "SUGGESTION_ONLY"
    | "PROVIDER_LIMITED"
    | "INPUT_TRUNCATED"
    | "NEEDS_QA_REVIEW";
  message: string;
};

export type AiRefinementRequest = {
  target: AiRefinementTarget;
  deterministicInput: unknown;
  contextSummary?: string;
  reviewedSessionSummary?: string;
  userPromptNote?: string;
};

export type AiRefinementResult = {
  target: AiRefinementTarget;
  mode: Extract<LlmMode, "llm-assisted">;
  generatedAt: IsoDateTimeString;
  providerSummary: AiRefinementProviderSummary;
  sections: AiRefinementSection[];
  warnings: AiRefinementWarning[];
  disclaimer: string;
};

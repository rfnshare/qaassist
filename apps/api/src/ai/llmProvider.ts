import type { StoryAnalysisAssistResult, StoryRequirementAnalysis, WorkItemDetail } from "@qa-assist/shared";
import { LLM_ASSIST_DISCLAIMER, type LlmRuntimeConfig, summarizeLlmProvider } from "./llmConfig.js";
import { createAzureOpenAiAdapter } from "./azureOpenAiAdapter.js";
import { createOpenAiAdapter } from "./openAiAdapter.js";

export type LlmPromptRequest = {
  system: string;
  user: string;
};

export type LlmTextProvider = {
  complete(input: LlmPromptRequest): Promise<string>;
};

export function createLlmProvider(config: LlmRuntimeConfig): LlmTextProvider | undefined {
  const summary = summarizeLlmProvider(config);

  if (summary.availability !== "available") {
    return undefined;
  }

  if (config.provider === "openai") {
    return createOpenAiAdapter(config);
  }

  if (config.provider === "azure-openai") {
    return createAzureOpenAiAdapter(config);
  }

  return undefined;
}

export async function generateStoryAnalysisAssist(input: {
  workItem: WorkItemDetail;
  deterministicAnalysis: StoryRequirementAnalysis;
  config: LlmRuntimeConfig;
  provider: LlmTextProvider;
}): Promise<StoryAnalysisAssistResult> {
  const providerSummary = summarizeLlmProvider(input.config);
  const rawText = await input.provider.complete({
    system: [
      "You are QA Assist. Return concise JSON only.",
      "Use deterministic evidence as the source of truth.",
      "Do not invent domain facts. Mark uncertain output as needs-confirmation."
    ].join(" "),
    user: buildStoryAssistPrompt(input.workItem, input.deterministicAnalysis)
  });
  const parsed = parseAssistJson(rawText);

  return {
    mode: "llm-assisted",
    generatedAt: new Date().toISOString(),
    provider: providerSummary,
    suggestedRequirementSummary: {
      text: parsed.suggestedRequirementSummary || "No requirement summary refinement returned by the provider.",
      certainty: "needs-confirmation"
    },
    suggestedGapsOrQuestions: parsed.suggestedGapsOrQuestions.map((text) => ({
      text,
      certainty: "needs-confirmation"
    })),
    suggestedLikelyTestAreas: parsed.suggestedLikelyTestAreas.map((text) => ({
      text,
      certainty: "needs-confirmation"
    })),
    warnings: [
      "LLM suggestions do not replace deterministic analysis.",
      "QA must confirm applicability before using any suggestion.",
      ...parsed.warnings
    ],
    disclaimer: LLM_ASSIST_DISCLAIMER
  };
}

function buildStoryAssistPrompt(workItem: WorkItemDetail, analysis: StoryRequirementAnalysis): string {
  return JSON.stringify({
    instruction: "Suggest refinements for QA review. Return JSON with suggestedRequirementSummary, suggestedGapsOrQuestions, suggestedLikelyTestAreas, warnings.",
    workItem: {
      id: workItem.workItemId,
      type: workItem.workItemType,
      title: truncate(workItem.title, 240),
      description: truncate(workItem.descriptionText ?? "", 1200),
      acceptanceCriteria: truncate(workItem.acceptanceCriteriaText ?? "", 1200)
    },
    deterministicAnalysis: {
      headline: analysis.headline,
      requirementSummary: truncate(analysis.requirementSummary.text, 700),
      gaps: analysis.gaps.slice(0, 6).map((gap) => truncate(gap.text, 300)),
      questions: analysis.questionsForBAOrPO.slice(0, 6).map((question) => truncate(question.text, 300)),
      likelyTestAreas: analysis.likelyTestAreas.slice(0, 6).map((area) => `${area.name}: ${truncate(area.reason, 240)}`),
      linkedEvidence: analysis.linkedKnowledgeEvidence.slice(0, 4).map((item) => ({
        kind: item.kind,
        title: truncate(item.title, 160),
        preview: truncate(item.textPreview ?? item.evidenceLabel, 500)
      }))
    }
  });
}

function parseAssistJson(rawText: string): {
  suggestedRequirementSummary: string;
  suggestedGapsOrQuestions: string[];
  suggestedLikelyTestAreas: string[];
  warnings: string[];
} {
  try {
    const parsed = JSON.parse(extractJson(rawText)) as Record<string, unknown>;

    return {
      suggestedRequirementSummary: normalizeString(parsed.suggestedRequirementSummary),
      suggestedGapsOrQuestions: normalizeStringArray(parsed.suggestedGapsOrQuestions).slice(0, 6),
      suggestedLikelyTestAreas: normalizeStringArray(parsed.suggestedLikelyTestAreas).slice(0, 6),
      warnings: normalizeStringArray(parsed.warnings).slice(0, 4)
    };
  } catch {
    return {
      suggestedRequirementSummary: truncate(rawText, 600),
      suggestedGapsOrQuestions: [],
      suggestedLikelyTestAreas: [],
      warnings: ["Provider response was not structured JSON; returned text was treated as a needs-confirmation suggestion."]
    };
  }
}

function extractJson(value: string): string {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  return start >= 0 && end > start ? value.slice(start, end + 1) : value;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? truncate(value, 700) : "";
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => truncate(item, 500))
    : [];
}

function truncate(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

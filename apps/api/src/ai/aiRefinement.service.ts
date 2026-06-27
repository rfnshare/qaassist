import type {
  AiRefinementRequest,
  AiRefinementResult,
  AiRefinementSection,
  AiRefinementTarget,
  LlmProviderConfigurationSummary
} from "@qa-assist/shared";
import { type LlmRuntimeConfig, summarizeLlmProvider } from "./llmConfig.js";
import type { LlmTextProvider } from "./llmProvider.js";

const AI_REFINEMENT_DISCLAIMER =
  "AI-assisted refinement is a suggestion layer on top of deterministic QA Assist output and requires QA review before use.";
const MAX_PROMPT_CHARS = 9000;

export async function generateAiRefinement(input: {
  request: AiRefinementRequest;
  config: LlmRuntimeConfig;
  provider: LlmTextProvider;
}): Promise<AiRefinementResult> {
  const providerSummary = summarizeLlmProvider(input.config);
  const rawText = await input.provider.complete({
    system: [
      "You are QA Assist. Return concise JSON only.",
      "Refine deterministic QA Assist output without replacing it.",
      "Do not submit, approve, create, update, or write back anything.",
      "Mark suggestions as needing QA review."
    ].join(" "),
    user: buildRefinementPrompt(input.request)
  });
  const parsed = parseRefinementJson(rawText, input.request.target);

  return {
    target: input.request.target,
    mode: "llm-assisted",
    generatedAt: new Date().toISOString(),
    providerSummary: toSafeProviderSummary(providerSummary),
    sections: parsed.sections,
    warnings: [
      {
        code: "SUGGESTION_ONLY",
        message: "AI refinements are not automatically applied to deterministic output."
      },
      {
        code: "NEEDS_QA_REVIEW",
        message: "QA must review and manually decide whether any suggestion is useful."
      },
      ...parsed.warnings.map((message) => ({
        code: "PROVIDER_LIMITED" as const,
        message
      }))
    ],
    disclaimer: AI_REFINEMENT_DISCLAIMER
  };
}

export function getAiRefinementDisclaimer(): string {
  return AI_REFINEMENT_DISCLAIMER;
}

function buildRefinementPrompt(request: AiRefinementRequest): string {
  const payload = {
    instruction: targetInstruction(request.target),
    safety: [
      "Return suggestion-only refinements.",
      "Do not replace deterministic output.",
      "Do not generate Playwright or automation code.",
      "Do not create Azure DevOps bugs, comments, state changes, files, or test cases.",
      "Return JSON with sections: title, summary, bullets, suggestedEdits, confidenceNotes, and optional warnings."
    ],
    target: request.target,
    contextSummary: truncate(request.contextSummary ?? "", 1200),
    reviewedSessionSummary: truncate(request.reviewedSessionSummary ?? "", 1200),
    userPromptNote: truncate(request.userPromptNote ?? "", 800),
    deterministicInput: summarizeDeterministicInput(request.target, request.deterministicInput)
  };

  return truncate(JSON.stringify(payload), MAX_PROMPT_CHARS);
}

function targetInstruction(target: AiRefinementTarget): string {
  switch (target) {
    case "story-analysis":
      return "Suggest clearer Story analysis wording, clarifying questions, and possible missed QA risk areas.";
    case "draft-test-cases":
      return "Suggest improvements to draft test case wording, missing negative or edge considerations, and review notes.";
    case "automation-candidates":
      return "Suggest improved automation rationale, blockers, and starting points without generating code.";
    case "writeback-helper":
      return "Suggest safer wording for bug/comment/transition helper previews without submitting anything.";
  }
}

function summarizeDeterministicInput(target: AiRefinementTarget, value: unknown): unknown {
  if (!isObject(value)) {
    return truncate(String(value), 1600);
  }

  if (target === "story-analysis") {
    return pickAndTruncate(value, [
      "headline",
      "requirementSummary",
      "gaps",
      "questionsForBAOrPO",
      "likelyTestAreas",
      "risks",
      "needsConfirmation"
    ]);
  }

  if (target === "draft-test-cases") {
    return pickAndTruncate(value, [
      "coverageSummary",
      "draftCases",
      "blockedBy",
      "needsConfirmation",
      "warnings"
    ]);
  }

  if (target === "automation-candidates") {
    return pickAndTruncate(value, [
      "summary",
      "candidates",
      "blockedCases"
    ]);
  }

  return pickAndTruncate(value, [
    "helperType",
    "status",
    "preview",
    "warnings",
    "requiredConfirmations"
  ]);
}

function pickAndTruncate(value: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in value) {
      picked[key] = limitUnknown(value[key], 2200);
    }
  }
  return picked;
}

function limitUnknown(value: unknown, maxLength: number): unknown {
  const serialized = truncate(JSON.stringify(value) ?? String(value), maxLength);
  try {
    return JSON.parse(serialized) as unknown;
  } catch {
    return serialized;
  }
}

function parseRefinementJson(rawText: string, target: AiRefinementTarget): {
  sections: AiRefinementSection[];
  warnings: string[];
} {
  try {
    const parsed = JSON.parse(extractJson(rawText)) as Record<string, unknown>;
    const sections = normalizeSections(parsed.sections);

    return {
      sections: sections.length > 0 ? sections : [fallbackSection(target, rawText)],
      warnings: normalizeStringArray(parsed.warnings).slice(0, 4)
    };
  } catch {
    return {
      sections: [fallbackSection(target, rawText)],
      warnings: ["Provider response was not structured JSON; returned text was treated as a needs-review suggestion."]
    };
  }
}

function normalizeSections(value: unknown): AiRefinementSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 4).map((item, index) => {
    const object = isObject(item) ? item : {};
    return {
      title: normalizeString(object.title) || `Suggestion ${index + 1}`,
      summary: normalizeString(object.summary) || "Provider returned a suggestion that needs QA review.",
      bullets: normalizeStringArray(object.bullets).slice(0, 6),
      suggestedEdits: Array.isArray(object.suggestedEdits)
        ? object.suggestedEdits.slice(0, 5).map(normalizeSuggestedEdit)
        : [],
      confidenceNotes: normalizeStringArray(object.confidenceNotes).slice(0, 4)
    };
  });
}

function normalizeSuggestedEdit(value: unknown): AiRefinementSection["suggestedEdits"][number] {
  const object = isObject(value) ? value : {};
  return {
    field: normalizeString(object.field) || "review-note",
    suggestion: normalizeString(object.suggestion) || "Review this suggestion manually.",
    reason: normalizeString(object.reason) || undefined
  };
}

function fallbackSection(target: AiRefinementTarget, rawText: string): AiRefinementSection {
  return {
    title: fallbackTitle(target),
    summary: truncate(rawText, 700) || "No refinement text returned by the provider.",
    bullets: [],
    suggestedEdits: [],
    confidenceNotes: ["Provider output requires QA review and was not applied automatically."]
  };
}

function fallbackTitle(target: AiRefinementTarget): string {
  switch (target) {
    case "story-analysis":
      return "Story analysis refinement";
    case "draft-test-cases":
      return "Draft case refinement";
    case "automation-candidates":
      return "Automation refinement";
    case "writeback-helper":
      return "Write-back wording refinement";
  }
}

function toSafeProviderSummary(summary: LlmProviderConfigurationSummary): AiRefinementResult["providerSummary"] {
  return {
    provider: summary.provider,
    availability: summary.availability,
    model: summary.model,
    baseUrlConfigured: summary.baseUrlConfigured,
    apiKeyConfigured: summary.apiKeyConfigured
  };
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

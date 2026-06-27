import type { FastifyInstance } from "fastify";
import type {
  AiRefinementRequest,
  AiRefinementTarget,
  StoryAnalysisAssistRequest,
  StoryRequirementAnalysis,
  WorkItemDetail
} from "@qa-assist/shared";
import type { ApiEnv } from "../config/env.js";
import { generateAiRefinement } from "../ai/aiRefinement.service.js";
import { getLlmRuntimeConfig, summarizeLlmProvider } from "../ai/llmConfig.js";
import { createLlmProvider, generateStoryAnalysisAssist } from "../ai/llmProvider.js";

type StoryAssistBody = {
  workItem?: unknown;
  deterministicAnalysis?: unknown;
};

type AiRefinementBody = {
  target?: unknown;
  deterministicInput?: unknown;
  contextSummary?: unknown;
  reviewedSessionSummary?: unknown;
  userPromptNote?: unknown;
};

const AI_REFINEMENT_TARGETS: AiRefinementTarget[] = [
  "story-analysis",
  "draft-test-cases",
  "automation-candidates",
  "writeback-helper"
];

export async function registerAiRoutes(app: FastifyInstance, env: ApiEnv): Promise<void> {
  app.get("/ai/provider-status", async () => summarizeLlmProvider(getLlmRuntimeConfig(env)));

  app.post<{ Body: StoryAssistBody }>("/ai/story-analysis/assist", async (request) => {
    const input = validateStoryAssistBody(request.body);
    const config = getLlmRuntimeConfig(env);
    const summary = summarizeLlmProvider(config);

    if (summary.availability !== "available") {
      throw unavailable(summary.reason ?? "LLM provider is not available.");
    }

    const provider = createLlmProvider(config);
    if (!provider) {
      throw unavailable("LLM provider is not available.");
    }

    try {
      return await generateStoryAnalysisAssist({
        ...input,
        config,
        provider
      });
    } catch {
      throw unavailable("LLM-assisted Story analysis request failed.");
    }
  });

  app.post<{ Body: AiRefinementBody }>("/ai/refine", async (request) => {
    const input = validateAiRefinementBody(request.body);
    const config = getLlmRuntimeConfig(env);
    const summary = summarizeLlmProvider(config);

    if (summary.availability !== "available") {
      throw unavailable(summary.reason ?? "LLM provider is not available.");
    }

    const provider = createLlmProvider(config);
    if (!provider) {
      throw unavailable("LLM provider is not available.");
    }

    try {
      return await generateAiRefinement({
        request: input,
        config,
        provider
      });
    } catch {
      throw unavailable("AI-assisted refinement request failed.");
    }
  });
}

function validateStoryAssistBody(body: StoryAssistBody | undefined): StoryAnalysisAssistRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  if (!isObject(body.workItem)) {
    throw badRequest("workItem is required.");
  }

  if (!isObject(body.deterministicAnalysis)) {
    throw badRequest("deterministicAnalysis is required.");
  }

  const workItem = body.workItem as Partial<WorkItemDetail>;
  const deterministicAnalysis = body.deterministicAnalysis as Partial<StoryRequirementAnalysis>;

  if (!Number.isSafeInteger(workItem.workItemId) || !workItem.workItemId || workItem.workItemId <= 0) {
    throw badRequest("workItem.workItemId must be a positive integer.");
  }

  if (!isNonEmptyString(workItem.title)) {
    throw badRequest("workItem.title is required.");
  }

  if (deterministicAnalysis.mode !== "deterministic-preview") {
    throw badRequest("deterministicAnalysis.mode must be deterministic-preview.");
  }

  if (deterministicAnalysis.workItemId !== workItem.workItemId) {
    throw badRequest("deterministicAnalysis.workItemId must match workItem.workItemId.");
  }

  return {
    workItem: workItem as WorkItemDetail,
    deterministicAnalysis: deterministicAnalysis as StoryRequirementAnalysis
  };
}

function validateAiRefinementBody(body: AiRefinementBody | undefined): AiRefinementRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  if (!isAiRefinementTarget(body.target)) {
    throw badRequest("target must be one of story-analysis, draft-test-cases, automation-candidates, writeback-helper.");
  }

  if (body.deterministicInput === undefined || body.deterministicInput === null) {
    throw badRequest("deterministicInput is required.");
  }

  if (containsSensitiveKey(body.deterministicInput) || containsSensitiveKey(body.contextSummary) || containsSensitiveKey(body.reviewedSessionSummary) || containsSensitiveKey(body.userPromptNote)) {
    throw badRequest("Request body must not include secrets or credential-like fields.");
  }

  return {
    target: body.target,
    deterministicInput: body.deterministicInput,
    contextSummary: normalizeOptionalString(body.contextSummary),
    reviewedSessionSummary: normalizeOptionalString(body.reviewedSessionSummary),
    userPromptNote: normalizeOptionalString(body.userPromptNote)
  };
}

function isAiRefinementTarget(value: unknown): value is AiRefinementTarget {
  return typeof value === "string" && AI_REFINEMENT_TARGETS.includes(value as AiRefinementTarget);
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw badRequest("Optional context fields must be strings.");
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function containsSensitiveKey(value: unknown): boolean {
  if (!isObject(value)) {
    return false;
  }

  for (const [key, child] of Object.entries(value)) {
    if (/(pat|token|authorization|password|secret|apikey|api_key)/i.test(key)) {
      return true;
    }

    if (Array.isArray(child)) {
      if (child.some(containsSensitiveKey)) {
        return true;
      }
      continue;
    }

    if (containsSensitiveKey(child)) {
      return true;
    }
  }

  return false;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

function unavailable(message: string): Error & { statusCode: number; code: "LLM_UNAVAILABLE" } {
  const error = new Error(message) as Error & { statusCode: number; code: "LLM_UNAVAILABLE" };
  error.statusCode = 503;
  error.code = "LLM_UNAVAILABLE";
  return error;
}

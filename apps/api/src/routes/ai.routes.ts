import type { FastifyInstance } from "fastify";
import type { StoryAnalysisAssistRequest, StoryRequirementAnalysis, WorkItemDetail } from "@qa-assist/shared";
import type { ApiEnv } from "../config/env.js";
import { getLlmRuntimeConfig, summarizeLlmProvider } from "../ai/llmConfig.js";
import { createLlmProvider, generateStoryAnalysisAssist } from "../ai/llmProvider.js";

type StoryAssistBody = {
  workItem?: unknown;
  deterministicAnalysis?: unknown;
};

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

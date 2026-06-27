import type { LlmProviderConfigurationSummary, LlmProviderName } from "@qa-assist/shared";
import type { ApiEnv } from "../config/env.js";

export const LLM_ASSIST_DISCLAIMER =
  "LLM-assisted output is a suggestion layer on top of deterministic evidence and requires QA review.";

export type LlmRuntimeConfig = {
  provider: LlmProviderName;
  openAiApiKey?: string;
  openAiModel?: string;
  openAiBaseUrl?: string;
  azureOpenAiApiKey?: string;
  azureOpenAiEndpoint?: string;
  azureOpenAiDeployment?: string;
  azureOpenAiApiVersion?: string;
};

export function getLlmRuntimeConfig(env: ApiEnv): LlmRuntimeConfig {
  return {
    provider: normalizeProvider(env.llmProvider),
    openAiApiKey: env.openAiApiKey,
    openAiModel: env.openAiModel,
    openAiBaseUrl: env.openAiBaseUrl,
    azureOpenAiApiKey: env.azureOpenAiApiKey,
    azureOpenAiEndpoint: env.azureOpenAiEndpoint,
    azureOpenAiDeployment: env.azureOpenAiDeployment,
    azureOpenAiApiVersion: env.azureOpenAiApiVersion
  };
}

export function summarizeLlmProvider(config: LlmRuntimeConfig): LlmProviderConfigurationSummary {
  if (config.provider === "disabled") {
    return summary(config.provider, "disabled", {
      reason: "LLM provider is disabled. Deterministic preview mode remains available."
    });
  }

  if (config.provider === "openai") {
    const apiKeyConfigured = Boolean(config.openAiApiKey);
    const model = config.openAiModel;

    if (!apiKeyConfigured || !model) {
      return summary(config.provider, "misconfigured", {
        model,
        apiKeyConfigured,
        baseUrlConfigured: Boolean(config.openAiBaseUrl),
        reason: "OpenAI provider requires OPENAI_API_KEY and OPENAI_MODEL on the backend."
      });
    }

    return summary(config.provider, "available", {
      model,
      apiKeyConfigured,
      baseUrlConfigured: Boolean(config.openAiBaseUrl)
    });
  }

  const apiKeyConfigured = Boolean(config.azureOpenAiApiKey);
  const model = config.azureOpenAiDeployment;
  const baseUrlConfigured = Boolean(config.azureOpenAiEndpoint);

  if (!apiKeyConfigured || !model || !baseUrlConfigured) {
    return summary(config.provider, "misconfigured", {
      model,
      apiKeyConfigured,
      baseUrlConfigured,
      reason: "Azure OpenAI provider requires AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT on the backend."
    });
  }

  return summary(config.provider, "available", {
    model,
    apiKeyConfigured,
    baseUrlConfigured
  });
}

function summary(
  provider: LlmProviderName,
  availability: LlmProviderConfigurationSummary["availability"],
  options: {
    model?: string;
    apiKeyConfigured?: boolean;
    baseUrlConfigured?: boolean;
    reason?: string;
  } = {}
): LlmProviderConfigurationSummary {
  return {
    provider,
    availability,
    model: options.model,
    baseUrlConfigured: options.baseUrlConfigured ?? false,
    apiKeyConfigured: options.apiKeyConfigured ?? false,
    reason: options.reason,
    disclaimer: LLM_ASSIST_DISCLAIMER
  };
}

function normalizeProvider(value: string | undefined): LlmProviderName {
  if (value === "openai" || value === "azure-openai") {
    return value;
  }

  return "disabled";
}

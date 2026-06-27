import type { LlmRuntimeConfig } from "./llmConfig.js";
import type { LlmTextProvider } from "./llmProvider.js";

type AzureOpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export function createAzureOpenAiAdapter(config: LlmRuntimeConfig): LlmTextProvider {
  return {
    async complete(input) {
      const endpoint = (config.azureOpenAiEndpoint ?? "").replace(/\/$/, "");
      const deployment = encodeURIComponent(config.azureOpenAiDeployment ?? "");
      const apiVersion = encodeURIComponent(config.azureOpenAiApiVersion ?? "2024-02-15-preview");
      const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`, {
        method: "POST",
        headers: {
          "api-key": config.azureOpenAiApiKey ?? "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error("LLM provider request failed.");
      }

      const payload = (await response.json()) as AzureOpenAiChatResponse;
      const content = payload.choices?.[0]?.message?.content;

      if (!content?.trim()) {
        throw new Error("LLM provider returned no content.");
      }

      return content;
    }
  };
}

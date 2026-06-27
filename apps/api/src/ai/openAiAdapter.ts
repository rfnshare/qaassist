import type { LlmRuntimeConfig } from "./llmConfig.js";
import type { LlmTextProvider } from "./llmProvider.js";

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export function createOpenAiAdapter(config: LlmRuntimeConfig): LlmTextProvider {
  return {
    async complete(input) {
      const baseUrl = config.openAiBaseUrl ?? "https://api.openai.com/v1";
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.openAiApiKey ?? ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.openAiModel,
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

      const payload = (await response.json()) as OpenAiChatResponse;
      const content = payload.choices?.[0]?.message?.content;

      if (!content?.trim()) {
        throw new Error("LLM provider returned no content.");
      }

      return content;
    }
  };
}

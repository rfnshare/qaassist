export type ApiEnv = {
  host: string;
  port: number;
  extensionOrigin: string;
  nodeEnv: "development" | "test" | "production";
  azureDevOpsPat?: string;
  azureDevOpsApiVersion: string;
  azureDevOpsRequestTimeoutMs: number;
  llmProvider?: string;
  openAiApiKey?: string;
  openAiModel?: string;
  openAiBaseUrl?: string;
  azureOpenAiApiKey?: string;
  azureOpenAiEndpoint?: string;
  azureOpenAiDeployment?: string;
  azureOpenAiApiVersion?: string;
};

const DEFAULT_PORT = 4317;
const DEFAULT_AZURE_DEVOPS_API_VERSION = "7.1";
const DEFAULT_AZURE_DEVOPS_REQUEST_TIMEOUT_MS = 10000;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  const port = Number(source.API_PORT ?? DEFAULT_PORT);
  const azureDevOpsRequestTimeoutMs = Number(
    source.AZURE_DEVOPS_REQUEST_TIMEOUT_MS ?? DEFAULT_AZURE_DEVOPS_REQUEST_TIMEOUT_MS
  );

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("API_PORT must be a valid TCP port.");
  }

  if (!Number.isInteger(azureDevOpsRequestTimeoutMs) || azureDevOpsRequestTimeoutMs <= 0) {
    throw new Error("AZURE_DEVOPS_REQUEST_TIMEOUT_MS must be a positive integer.");
  }

  return {
    host: source.API_HOST ?? "127.0.0.1",
    port,
    extensionOrigin: source.EXTENSION_ORIGIN ?? "chrome-extension://replace-after-local-install",
    nodeEnv: parseNodeEnv(source.NODE_ENV),
    azureDevOpsPat: normalizeOptionalSecret(source.AZURE_DEVOPS_PAT),
    azureDevOpsApiVersion: source.AZURE_DEVOPS_API_VERSION ?? DEFAULT_AZURE_DEVOPS_API_VERSION,
    azureDevOpsRequestTimeoutMs,
    llmProvider: normalizeOptionalString(source.LLM_PROVIDER),
    openAiApiKey: normalizeOptionalSecret(source.OPENAI_API_KEY),
    openAiModel: normalizeOptionalString(source.OPENAI_MODEL),
    openAiBaseUrl: normalizeOptionalString(source.OPENAI_BASE_URL),
    azureOpenAiApiKey: normalizeOptionalSecret(source.AZURE_OPENAI_API_KEY),
    azureOpenAiEndpoint: normalizeOptionalString(source.AZURE_OPENAI_ENDPOINT),
    azureOpenAiDeployment: normalizeOptionalString(source.AZURE_OPENAI_DEPLOYMENT),
    azureOpenAiApiVersion: normalizeOptionalString(source.AZURE_OPENAI_API_VERSION)
  };
}

function parseNodeEnv(value: string | undefined): ApiEnv["nodeEnv"] {
  if (value === "production" || value === "test" || value === "development") {
    return value;
  }

  return "development";
}

function normalizeOptionalSecret(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  return value;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

import { Buffer } from "node:buffer";
import { AzureDevOpsIntegrationError, missingAzureDevOpsTokenError } from "./azureDevOpsErrors.js";
import type { AzureDevOpsRuntimeConfig } from "./azureDevOpsConfig.js";

type AzureDevOpsRequestOptions = {
  organization: string;
  project?: string;
  path: string;
  query?: Record<string, string>;
  method?: "GET" | "POST";
  body?: unknown;
};

export type AzureDevOpsClient = {
  request<T>(options: AzureDevOpsRequestOptions): Promise<T>;
};

export function createAzureDevOpsClient(config: AzureDevOpsRuntimeConfig): AzureDevOpsClient {
  return {
    async request<T>(options: AzureDevOpsRequestOptions): Promise<T> {
      if (!config.pat) {
        throw missingAzureDevOpsTokenError();
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

      try {
        const response = await fetch(buildUrl(config, options), {
          method: options.method ?? "GET",
          headers: {
            Authorization: buildBasicAuthHeader(config.pat),
            "Content-Type": "application/json"
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });

        if (!response.ok) {
          throw new AzureDevOpsIntegrationError("Azure DevOps request failed.", {
            statusCode: response.status >= 500 ? 502 : response.status,
            code: response.status === 401 || response.status === 403 ? "FORBIDDEN" : "UPSTREAM_ERROR"
          });
        }

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof AzureDevOpsIntegrationError) {
          throw error;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          throw new AzureDevOpsIntegrationError("Azure DevOps request timed out.", {
            statusCode: 504,
            code: "UPSTREAM_ERROR"
          });
        }

        throw new AzureDevOpsIntegrationError("Azure DevOps request could not be completed.", {
          statusCode: 502,
          code: "UPSTREAM_ERROR"
        });
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

function buildUrl(config: AzureDevOpsRuntimeConfig, options: AzureDevOpsRequestOptions): string {
  const projectSegment = options.project ? `/${encodeURIComponent(options.project)}` : "";
  const url = new URL(
    `https://dev.azure.com/${encodeURIComponent(options.organization)}${projectSegment}/_apis/${options.path}`
  );
  url.searchParams.set("api-version", config.apiVersion);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function buildBasicAuthHeader(pat: string): string {
  return `Basic ${Buffer.from(`:${pat}`).toString("base64")}`;
}

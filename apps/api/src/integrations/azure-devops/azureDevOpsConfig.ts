import type { ApiEnv } from "../../config/env.js";

export type AzureDevOpsRuntimeConfig = {
  pat?: string;
  apiVersion: string;
  requestTimeoutMs: number;
};

export function getAzureDevOpsRuntimeConfig(env: ApiEnv): AzureDevOpsRuntimeConfig {
  return {
    pat: env.azureDevOpsPat,
    apiVersion: env.azureDevOpsApiVersion,
    requestTimeoutMs: env.azureDevOpsRequestTimeoutMs
  };
}

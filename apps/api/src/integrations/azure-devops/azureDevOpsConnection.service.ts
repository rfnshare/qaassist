import type { AzureDevOpsConnectionInfo } from "@qa-assist/shared";
import type { AzureDevOpsRuntimeConfig } from "./azureDevOpsConfig.js";
import { missingAzureDevOpsTokenError } from "./azureDevOpsErrors.js";
import { parseAzureDevOpsUrl } from "./azureDevOpsUrlParser.js";

export function parseAzureDevOpsConnectionUrl(
  url: string,
  config: AzureDevOpsRuntimeConfig
): AzureDevOpsConnectionInfo {
  const parsed = parseAzureDevOpsUrl(url);

  if (!config.pat) {
    throw missingAzureDevOpsTokenError();
  }

  return {
    source: "azure-devops",
    ...parsed,
    status: "needs-attention"
  };
}

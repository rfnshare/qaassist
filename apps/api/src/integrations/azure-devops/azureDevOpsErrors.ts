import type { ApiErrorCode } from "@qa-assist/shared";

export class AzureDevOpsIntegrationError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;
  readonly exposeMessage = true;

  constructor(message: string, options: { statusCode: number; code: ApiErrorCode }) {
    super(message);
    this.name = "AzureDevOpsIntegrationError";
    this.statusCode = options.statusCode;
    this.code = options.code;
  }
}

export function missingAzureDevOpsTokenError(): AzureDevOpsIntegrationError {
  return new AzureDevOpsIntegrationError(
    "Azure DevOps backend token is not configured. Add it to local .env on the API server.",
    {
      statusCode: 503,
      code: "UPSTREAM_ERROR"
    }
  );
}

import type { AzureDevOpsConnectionInfo, AzureDevOpsConnectionMode } from "@qa-assist/shared";

export type ParsedAzureDevOpsUrl = Omit<AzureDevOpsConnectionInfo, "source" | "status" | "connectedAt">;

export function parseAzureDevOpsUrl(value: string): ParsedAzureDevOpsUrl {
  const rawUrl = value.trim();

  if (!rawUrl) {
    throw validationError("Azure DevOps Services or TFS URL is required.");
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw validationError("Enter a valid Azure DevOps Services or TFS URL.");
  }

  if (url.protocol !== "https:") {
    throw validationError("Only https Azure DevOps or TFS URLs are supported for setup.");
  }

  if (url.hostname === "dev.azure.com") {
    return parseDevAzureUrl(url, rawUrl);
  }

  if (url.hostname.endsWith(".visualstudio.com")) {
    return parseVisualStudioUrl(url, rawUrl);
  }

  return parseTfsUrl(url, rawUrl);
}

function parseDevAzureUrl(url: URL, sourceUrl: string): ParsedAzureDevOpsUrl {
  const [organization, project] = getPathSegments(url);

  if (!organization) {
    throw validationError("Azure DevOps Services URL must include an organization.");
  }

  return {
    sourceUrl,
    serverUrl: `https://dev.azure.com/${organization}`,
    mode: "azure-devops-services",
    organization,
    project,
    displayLabel: project ? `${organization}/${project}` : organization
  };
}

function parseVisualStudioUrl(url: URL, sourceUrl: string): ParsedAzureDevOpsUrl {
  const organization = url.hostname.replace(".visualstudio.com", "");
  const [project] = getPathSegments(url);

  if (!organization) {
    throw validationError("Visual Studio URL must include an organization subdomain.");
  }

  return {
    sourceUrl,
    serverUrl: `https://${organization}.visualstudio.com`,
    mode: "azure-devops-services",
    organization,
    project,
    displayLabel: project ? `${organization}/${project}` : organization,
    warnings: ["Legacy visualstudio.com URLs are normalized to Azure DevOps Services setup."]
  };
}

function parseTfsUrl(url: URL, sourceUrl: string): ParsedAzureDevOpsUrl {
  const segments = getPathSegments(url);
  const tfsIndex = segments.findIndex((segment) => segment.toLowerCase() === "tfs");
  const collection = tfsIndex >= 0 ? segments[tfsIndex + 1] : undefined;
  const project = tfsIndex >= 0 ? segments[tfsIndex + 2] : undefined;

  if (!collection) {
    throw validationError("TFS URL must include /tfs/{collection}.");
  }

  return {
    sourceUrl,
    serverUrl: `${url.origin}/tfs/${collection}`,
    mode: "team-foundation-server" satisfies AzureDevOpsConnectionMode,
    collection,
    project,
    displayLabel: project ? `${url.hostname}/${collection}/${project}` : `${url.hostname}/${collection}`,
    warnings: ["TFS URL parsing is supported, but full TFS discovery is a later adapter capability."]
  };
}

function getPathSegments(url: URL): string[] {
  return url.pathname.split("/").map((segment) => decodeURIComponent(segment)).filter(Boolean);
}

function validationError(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR"; exposeMessage: true } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR"; exposeMessage: true };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  error.exposeMessage = true;
  return error;
}

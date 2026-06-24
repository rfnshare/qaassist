import type { SourceProvider } from "@qa-assist/shared";

export type AzureDevOpsPageContext = {
  source: Extract<SourceProvider, "azure-devops">;
  organization: string;
  project: string;
  workItemId: number;
  workItemUrl: string;
  detectedAt: string;
};

export function parseAzureDevOpsWorkItemUrl(url: string): AzureDevOpsPageContext | null {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== "https:") {
    return null;
  }

  if (parsedUrl.hostname === "dev.azure.com") {
    return parseDevAzureUrl(parsedUrl);
  }

  if (parsedUrl.hostname.endsWith(".visualstudio.com")) {
    return parseVisualStudioUrl(parsedUrl);
  }

  return null;
}

function parseDevAzureUrl(url: URL): AzureDevOpsPageContext | null {
  const [organization, project, ...rest] = getPathParts(url);

  if (!organization || !project) {
    return null;
  }

  const workItemId = parseWorkItemId(rest, url);

  if (!workItemId) {
    return null;
  }

  return createContext({
    organization,
    project,
    workItemId,
    workItemUrl: url.href
  });
}

function parseVisualStudioUrl(url: URL): AzureDevOpsPageContext | null {
  const organization = url.hostname.replace(/\.visualstudio\.com$/, "");
  const [project, ...rest] = getPathParts(url);

  if (!organization || !project) {
    return null;
  }

  const workItemId = parseWorkItemId(rest, url);

  if (!workItemId) {
    return null;
  }

  return createContext({
    organization,
    project,
    workItemId,
    workItemUrl: url.href
  });
}

function parseWorkItemId(pathParts: string[], url: URL): number | null {
  const editIndex = pathParts.findIndex((part) => part === "_workitems");

  if (editIndex >= 0 && pathParts[editIndex + 1] === "edit") {
    return parsePositiveInteger(pathParts[editIndex + 2]);
  }

  return parsePositiveInteger(url.searchParams.get("workitem"));
}

function parsePositiveInteger(value: string | null | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function getPathParts(url: URL): string[] {
  return url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
}

function createContext(input: Omit<AzureDevOpsPageContext, "source" | "detectedAt">): AzureDevOpsPageContext {
  return {
    source: "azure-devops",
    detectedAt: new Date().toISOString(),
    ...input
  };
}

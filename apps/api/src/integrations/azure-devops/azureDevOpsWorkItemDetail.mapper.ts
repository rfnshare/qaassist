import type {
  AzureWorkItemDetail,
  WorkItemRelationKind,
  WorkItemRelationSummary,
  WorkItemType
} from "@qa-assist/shared";

type AzureIdentity = {
  displayName?: string;
  uniqueName?: string;
  mailAddress?: string;
};

export type AzureWorkItemDetailResponse = {
  id: number;
  url?: string;
  fields?: Record<string, unknown>;
  relations?: AzureWorkItemRelation[];
};

type AzureWorkItemRelation = {
  rel?: string;
  url?: string;
  attributes?: {
    name?: string;
    [key: string]: unknown;
  };
};

export function mapAzureWorkItemDetail(
  item: AzureWorkItemDetailResponse,
  context: {
    organization: string;
    project: string;
    apiVersion: string;
    fetchedAt: string;
    fallbackUrl?: string;
  }
): AzureWorkItemDetail {
  const fields = item.fields ?? {};
  const title = readString(fields["System.Title"]) ?? `Work item ${item.id}`;

  return {
    source: "azure-devops",
    organization: context.organization,
    project: context.project,
    workItemId: item.id,
    url: item.url ?? context.fallbackUrl ?? buildWorkItemUrl(context.organization, context.project, item.id),
    workItemType: mapWorkItemType(readString(fields["System.WorkItemType"])),
    title,
    state: readString(fields["System.State"]),
    assignedTo: readIdentity(fields["System.AssignedTo"]),
    descriptionHtml: readString(fields["System.Description"]),
    descriptionText: htmlToText(readString(fields["System.Description"])),
    acceptanceCriteriaHtml: readString(fields["Microsoft.VSTS.Common.AcceptanceCriteria"]),
    acceptanceCriteriaText: htmlToText(readString(fields["Microsoft.VSTS.Common.AcceptanceCriteria"])),
    tags: readTags(fields["System.Tags"]),
    priority: readNumberOrString(fields["Microsoft.VSTS.Common.Priority"]),
    severity: readString(fields["Microsoft.VSTS.Common.Severity"]),
    storyPoints: readNumber(fields["Microsoft.VSTS.Scheduling.StoryPoints"]),
    createdDate: readString(fields["System.CreatedDate"]),
    changedDate: readString(fields["System.ChangedDate"]),
    createdBy: readIdentity(fields["System.CreatedBy"]),
    changedBy: readIdentity(fields["System.ChangedBy"]),
    areaPath: readString(fields["System.AreaPath"]),
    iterationPath: readString(fields["System.IterationPath"]),
    relations: mapRelations(item.relations ?? []),
    evidence: {
      fetchedAt: context.fetchedAt,
      apiVersion: context.apiVersion,
      sourceDescription: "Fetched read-only from Azure DevOps Work Items API with relations expanded."
    },
    workspace: {
      activeSections: [
        "summary",
        "details",
        "description",
        "acceptance-criteria",
        "relations",
        "requirement-analysis",
        "gaps",
        "test-scope"
      ],
      placeholders: {
        requirementSummaryStatus: "not-started",
        gapsStatus: "not-started",
        testScopeStatus: "not-started",
        message: "Fetch details first. AI analysis and test case generation will be added later and must stay source-backed."
      }
    }
  };
}

function mapRelations(relations: AzureWorkItemRelation[]): WorkItemRelationSummary[] {
  return relations.map((relation) => ({
    kind: mapRelationKind(relation.rel, relation.attributes?.name),
    relationType: relation.rel ?? relation.attributes?.name ?? "unknown",
    workItemId: extractWorkItemId(relation.url),
    url: relation.url,
    title: readString(relation.attributes?.name),
    sourceDescription: "Azure DevOps work item relation."
  }));
}

function mapRelationKind(rel: string | undefined, name: string | undefined): WorkItemRelationKind {
  const value = `${rel ?? ""} ${name ?? ""}`.toLowerCase();
  if (value.includes("hierarchy-reverse") || value.includes("parent")) return "parent";
  if (value.includes("hierarchy-forward") || value.includes("child")) return "child";
  if (value.includes("duplicate of")) return "duplicate-of";
  if (value.includes("duplicate")) return "duplicate";
  if (value.includes("testedby") || value.includes("tested by")) return "tested-by";
  if (value.includes("test")) return "test-case";
  if (value.includes("related")) return "related";
  return "other";
}

function extractWorkItemId(url: string | undefined): number | undefined {
  if (!url) {
    return undefined;
  }

  const match = url.match(/\/workItems\/(\d+)$/i);
  return match ? Number(match[1]) : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readNumberOrString(value: unknown): number | string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return readString(value);
}

function readIdentity(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    const identity = value as AzureIdentity;
    return readString(identity.displayName) ?? readString(identity.uniqueName) ?? readString(identity.mailAddress);
  }

  return undefined;
}

function readTags(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(";")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function htmlToText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function mapWorkItemType(value: string | undefined): WorkItemType {
  switch (value?.toLowerCase()) {
    case "bug":
      return "bug";
    case "task":
      return "task";
    case "feature":
      return "feature";
    case "epic":
      return "epic";
    case "test case":
      return "test-case";
    case "user story":
    case "product backlog item":
      return "user-story";
    default:
      return "other";
  }
}

function buildWorkItemUrl(organization: string, project: string, workItemId: number): string {
  return `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_workitems/edit/${workItemId}`;
}

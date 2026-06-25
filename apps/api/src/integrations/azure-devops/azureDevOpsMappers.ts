import type {
  AzureDevOpsStateOption,
  BoardStateBucket,
  QaPriority,
  QaRiskLevel,
  QaWorkItemSignal,
  QaWorkItemSummary,
  QaWorkflowStateCategory,
  WorkItemType
} from "@qa-assist/shared";

type AzureWorkItem = {
  id: number;
  url?: string;
  fields: Record<string, unknown>;
};

type AzureState = {
  name: string;
  color?: string;
  category?: string;
};

export function mapAzureStateOption(state: AzureState, workItemType: string): AzureDevOpsStateOption {
  return {
    name: state.name,
    workItemTypes: [workItemType],
    category: state.category,
    color: state.color
  };
}

export function mapAzureWorkItem(
  item: AzureWorkItem,
  context: { organization: string; project: string; qaCategory?: QaWorkflowStateCategory }
): QaWorkItemSummary {
  const fields = item.fields;
  const priority = readNumberOrString(fields["Microsoft.VSTS.Common.Priority"]);
  const severity = readString(fields["Microsoft.VSTS.Common.Severity"]);
  const storyPoints = readNumber(fields["Microsoft.VSTS.Scheduling.StoryPoints"]);
  const changedDate = readString(fields["System.ChangedDate"]);
  const createdDate = readString(fields["System.CreatedDate"]);
  const isBlocked = isBlockedState(readString(fields["System.State"]), readTags(fields["System.Tags"]));

  return {
    source: "azure-devops",
    organization: context.organization,
    project: context.project,
    workItemId: item.id,
    workItemUrl: item.url ?? buildWorkItemUrl(context.organization, context.project, item.id),
    type: mapWorkItemType(readString(fields["System.WorkItemType"])),
    title: readString(fields["System.Title"]) ?? `Work item ${item.id}`,
    state: readString(fields["System.State"]) ?? "Unknown",
    assignedTo: readIdentity(fields["System.AssignedTo"]),
    priority: priority as QaPriority | number | string | undefined,
    severity: severity as QaRiskLevel | string | undefined,
    storyPoints,
    tags: readTags(fields["System.Tags"]),
    ageDays: createdDate ? calculateAgeDays(createdDate) : undefined,
    isBlocked,
    blockedReason: isBlocked ? "State or tag indicates blocked work." : undefined,
    qaCategory: context.qaCategory,
    lastUpdatedAt: changedDate,
    sourceUpdatedAt: changedDate,
    signals: buildSignals({ priority, severity, storyPoints, createdDate, state: readString(fields["System.State"]), isBlocked })
  };
}

export function createStateBucket(category: QaWorkflowStateCategory, label: string, items: QaWorkItemSummary[]): BoardStateBucket {
  return {
    category,
    label,
    count: items.length,
    items,
    sourceDescription: "Counted from Azure DevOps work items returned by the preview query."
  };
}

function buildSignals(input: {
  priority?: number | string;
  severity?: string;
  storyPoints?: number;
  createdDate?: string;
  state?: string;
  isBlocked: boolean;
}): QaWorkItemSignal[] {
  const signals: QaWorkItemSignal[] = [];

  if (input.priority !== undefined) {
    signals.push({ type: "priority", label: "Priority", value: input.priority });
  }

  if (input.severity) {
    signals.push({ type: "severity", label: "Severity", value: input.severity });
  }

  if (input.storyPoints !== undefined) {
    signals.push({ type: "story-points", label: "Story points", value: input.storyPoints });
  }

  if (input.createdDate) {
    const ageDays = calculateAgeDays(input.createdDate);
    if (ageDays !== undefined) {
      signals.push({ type: "age", label: "Age in days", value: ageDays });
    }
  }

  if (input.state) {
    signals.push({ type: "state", label: "State", value: input.state });
  }

  signals.push({ type: "blocked-status", label: "Blocked", value: input.isBlocked });

  return signals;
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
    const identity = value as Record<string, unknown>;
    const displayName = readString(identity.displayName);
    const uniqueName = readString(identity.uniqueName);
    const mailAddress = readString(identity.mailAddress);
    return displayName ?? uniqueName ?? mailAddress;
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

function isBlockedState(state: string | undefined, tags: string[]): boolean {
  return state?.toLowerCase().includes("blocked") === true || tags.some((tag) => tag.toLowerCase() === "blocked");
}

function calculateAgeDays(createdDate: string): number | undefined {
  const createdTime = new Date(createdDate).getTime();
  if (!Number.isFinite(createdTime)) {
    return undefined;
  }

  return Math.max(0, Math.floor((Date.now() - createdTime) / 86_400_000));
}

function buildWorkItemUrl(organization: string, project: string, workItemId: number): string {
  return `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_workitems/edit/${workItemId}`;
}

import type { SourceProvider } from "../common/sourceProvider.js";
import type { IsoDateTimeString } from "../common/timestamps.js";
import type { WorkItemType } from "./workItemContext.js";

export type WorkItemFieldValue = string | number | boolean | null;

export type WorkItemRelationKind =
  | "parent"
  | "child"
  | "related"
  | "duplicate"
  | "duplicate-of"
  | "tested-by"
  | "test-case"
  | "other";

export type WorkItemRelationSummary = {
  kind: WorkItemRelationKind;
  relationType: string;
  workItemId?: string | number;
  url?: string;
  title?: string;
  sourceDescription?: string;
};

export type WorkItemEvidenceSource = {
  fetchedAt: IsoDateTimeString;
  apiVersion: string;
  sourceDescription: string;
};

export type RequirementAnalysisPlaceholder = {
  requirementSummaryStatus: "not-started";
  gapsStatus: "not-started";
  testScopeStatus: "not-started";
  message: string;
};

export type StoryWorkspaceSection =
  | "summary"
  | "details"
  | "description"
  | "acceptance-criteria"
  | "relations"
  | "requirement-analysis"
  | "gaps"
  | "test-scope";

export type StoryWorkspaceState = {
  activeSections: StoryWorkspaceSection[];
  placeholders: RequirementAnalysisPlaceholder;
};

export type WorkItemDetail = {
  source: Extract<SourceProvider, "azure-devops">;
  organization: string;
  project: string;
  workItemId: number;
  url: string;
  workItemType: WorkItemType;
  title: string;
  state?: string;
  assignedTo?: string;
  descriptionHtml?: string;
  descriptionText?: string;
  acceptanceCriteriaHtml?: string;
  acceptanceCriteriaText?: string;
  tags: string[];
  priority?: number | string;
  severity?: string;
  storyPoints?: number;
  createdDate?: IsoDateTimeString;
  changedDate?: IsoDateTimeString;
  createdBy?: string;
  changedBy?: string;
  areaPath?: string;
  iterationPath?: string;
  relations: WorkItemRelationSummary[];
  evidence: WorkItemEvidenceSource;
  workspace: StoryWorkspaceState;
};

export type AzureWorkItemDetail = WorkItemDetail & {
  source: "azure-devops";
};

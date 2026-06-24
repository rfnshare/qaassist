import type { SourceProvider } from "../common/sourceProvider.js";
import type { IsoDateTimeString } from "../common/timestamps.js";

export type WorkItemType =
  | "epic"
  | "feature"
  | "user-story"
  | "bug"
  | "task"
  | "test-case"
  | "other";

export type WorkItemComment = {
  id: string;
  authorName?: string;
  bodyText: string;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

export type LinkedWorkItem = {
  source: SourceProvider;
  workItemId: string | number;
  title?: string;
  type?: WorkItemType;
  relationType?: string;
  url?: string;
};

export type AttachmentSummary = {
  id: string;
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
  url?: string;
};

export type WorkItemContext = {
  source: SourceProvider;
  organization: string;
  project: string;
  workItemId: number;
  workItemUrl: string;
  type: WorkItemType;
  title: string;
  state?: string;
  assignedTo?: string;
  areaPath?: string;
  iterationPath?: string;
  tags: string[];
  descriptionText: string;
  acceptanceCriteriaText?: string;
  businessRulesText?: string;
  comments: WorkItemComment[];
  linkedItems: LinkedWorkItem[];
  attachments: AttachmentSummary[];
  capturedAt: IsoDateTimeString;
};

import type { IsoDateTimeString } from "../common/timestamps.js";

export type AzureDevOpsBoardIdentity = {
  source: "azure-devops";
  organization: string;
  project: string;
  team?: string;
  board?: string;
  iterationPath?: string;
  boardId?: string;
  projectId?: string;
};

export type BoardScope = AzureDevOpsBoardIdentity;

export type BoardSelection = {
  selectedBoard: BoardScope;
  selectedAt: IsoDateTimeString;
  selectedBy?: string;
  isDefault?: boolean;
};

export type QaWorkflowStateCategory =
  | "in-qa"
  | "ready-to-test"
  | "resolved"
  | "blocked"
  | "ready-for-uat";

export type AzureDevOpsStateOption = {
  name: string;
  workItemTypes?: string[];
  category?: string;
  color?: string;
};

export type AzureDevOpsStateMapping = {
  rawStateName: string;
  qaCategory: QaWorkflowStateCategory;
  enabled: boolean;
  workItemTypes?: string[];
  updatedAt: IsoDateTimeString;
};

export type AzureDevOpsStateMappingSettings = {
  boardScope: BoardScope;
  availableStates: AzureDevOpsStateOption[];
  mappings: AzureDevOpsStateMapping[];
  updatedAt: IsoDateTimeString;
};

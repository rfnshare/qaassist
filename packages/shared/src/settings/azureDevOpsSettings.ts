import type { IsoDateTimeString } from "../common/timestamps.js";

export type AzureDevOpsConnectionMode =
  | "azure-devops-services"
  | "team-foundation-server"
  | "local-dev-backend";

export type AzureDevOpsConnectionStatus =
  | "not-connected"
  | "connecting"
  | "connected"
  | "needs-attention";

export type AzureDevOpsConnectionInput = {
  url: string;
};

export type AzureDevOpsConnectionInfo = {
  source: "azure-devops";
  sourceUrl: string;
  serverUrl: string;
  mode: AzureDevOpsConnectionMode;
  status: AzureDevOpsConnectionStatus;
  displayLabel: string;
  organization?: string;
  collection?: string;
  project?: string;
  connectedAt?: IsoDateTimeString;
  warnings?: string[];
};

export type AzureDevOpsProjectOption = {
  id?: string;
  name: string;
  description?: string;
  url?: string;
};

export type AzureDevOpsTeamOption = {
  id?: string;
  name: string;
  description?: string;
  url?: string;
  projectName: string;
};

export type SelectedAzureDevOpsTeamBoard = {
  source: "azure-devops";
  sourceUrl: string;
  mode: AzureDevOpsConnectionMode;
  organization?: string;
  collection?: string;
  project: string;
  team: string;
  board?: string;
  iterationPath?: string;
  displayLabel: string;
  selectedAt: IsoDateTimeString;
};

export type AzureDevOpsSetupState = {
  connection?: AzureDevOpsConnectionInfo;
  projects: AzureDevOpsProjectOption[];
  teams: AzureDevOpsTeamOption[];
  selectedTeamBoard?: SelectedAzureDevOpsTeamBoard;
  status: AzureDevOpsConnectionStatus;
  updatedAt?: IsoDateTimeString;
  warnings?: string[];
};

export type AzureDevOpsBoardIdentity = {
  source: "azure-devops";
  serverUrl?: string;
  connectionMode?: AzureDevOpsConnectionMode;
  connectionStatus?: AzureDevOpsConnectionStatus;
  lastConnectedAt?: IsoDateTimeString;
  displayLabel?: string;
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

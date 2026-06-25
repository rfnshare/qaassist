export type QaUserIdentitySource =
  | "microsoft-identity"
  | "configured-user"
  | "assigned-to"
  | "manual";

export type CurrentQaUserSettings = {
  displayName: string;
  email?: string;
  azureDevOpsDescriptor?: string;
  source: QaUserIdentitySource;
  isOverride: boolean;
};

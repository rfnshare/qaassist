import type { BoardScope } from "../settings/azureDevOpsSettings.js";

export type TestManagementProvider =
  | "azure-test-plans"
  | "testrail"
  | "zephyr"
  | "markdown"
  | "export";

export type AzureTestPlansDestination = {
  provider: "azure-test-plans";
  organization: string;
  project: string;
  testPlanId?: string | number;
  testSuiteId?: string | number;
  areaPath?: string;
  iterationPath?: string;
  linkTestCasesToStory: boolean;
  requireApprovalBeforeCreate: boolean;
};

export type TestManagementSettings = {
  boardScope: BoardScope;
  provider: TestManagementProvider;
  azureTestPlans?: AzureTestPlansDestination;
  requireApprovalBeforeCreate: boolean;
};

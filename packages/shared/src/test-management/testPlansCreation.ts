import type { IsoDateTimeString } from "../common/timestamps.js";
import type { TestPlansReadinessResult, TestPlansTargetSettings } from "./testPlansReadiness.js";

export type TestPlansCreationMode = "explicit-confirmation";

export type TestPlansCreationStatus =
  | "created"
  | "partial-success"
  | "failed"
  | "cancelled";

export type TestPlansCreationCandidateSelection = {
  selectedCandidateIds: string[];
};

export type TestPlansCreationConfirmation = {
  confirmedByUser: boolean;
  confirmationText?: string;
  confirmedAt?: IsoDateTimeString;
};

export type TestPlansCreatedItem = {
  reviewedCaseId: string;
  originalDraftId: string;
  title: string;
  azureWorkItemId: number;
  azureWorkItemUrl?: string;
  testPlanId: string | number;
  testSuiteId: string | number;
  createdAt: IsoDateTimeString;
};

export type TestPlansCreationFailure = {
  reviewedCaseId: string;
  originalDraftId: string;
  title: string;
  reason: string;
};

export type TestPlansSkippedItem = {
  reviewedCaseId: string;
  originalDraftId: string;
  title: string;
  reason: string;
};

export type TestPlansCreationRequest = {
  readinessResult: TestPlansReadinessResult;
  selectedCandidateIds: string[];
  confirmation: TestPlansCreationConfirmation;
};

export type TestPlansCreationResult = {
  mode: TestPlansCreationMode;
  status: TestPlansCreationStatus;
  startedAt: IsoDateTimeString;
  completedAt: IsoDateTimeString;
  target: TestPlansTargetSettings;
  createdItems: TestPlansCreatedItem[];
  failedItems: TestPlansCreationFailure[];
  skippedItems: TestPlansSkippedItem[];
  disclaimer: string;
};

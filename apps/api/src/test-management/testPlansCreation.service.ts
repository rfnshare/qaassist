import type {
  TestPlansCreationFailure,
  TestPlansCreationRequest,
  TestPlansCreationResult,
  TestPlansCreatedItem,
  TestPlansExportCandidate,
  TestPlansSkippedItem
} from "@qa-assist/shared";
import { AzureDevOpsIntegrationError } from "../integrations/azure-devops/azureDevOpsErrors.js";
import type { AzureTestPlansClient } from "./azureTestPlansClient.js";

export const TEST_PLANS_CREATION_DISCLAIMER =
  "Azure Test Plans creation ran only for the explicitly selected candidates after user confirmation.";

export async function createExplicitTestPlansCases(
  input: TestPlansCreationRequest,
  client: AzureTestPlansClient
): Promise<TestPlansCreationResult> {
  const startedAt = new Date().toISOString();
  const selectedIds = new Set(input.selectedCandidateIds);
  const selectedCandidates = input.readinessResult.candidates.filter((candidate) => selectedIds.has(candidate.reviewedCaseId) || selectedIds.has(candidate.originalDraftId));
  const skippedItems = buildSkippedItems(input.readinessResult.candidates, selectedIds);
  const createdItems: TestPlansCreatedItem[] = [];
  const failedItems: TestPlansCreationFailure[] = [];

  for (const candidate of selectedCandidates) {
    let created: Awaited<ReturnType<AzureTestPlansClient["createTestCase"]>> | undefined;

    try {
      created = await client.createTestCase({
        organization: input.readinessResult.target.organization,
        project: input.readinessResult.target.project,
        title: candidate.title,
        previewFields: candidate.previewFields
      });
    } catch (error) {
      if (error instanceof AzureDevOpsIntegrationError && error.statusCode === 503) {
        throw error;
      }

      failedItems.push({
        reviewedCaseId: candidate.reviewedCaseId,
        originalDraftId: candidate.originalDraftId,
        title: candidate.title,
        reason: sanitizeCreationError(error)
      });
      continue;
    }

    try {
      await client.addTestCaseToSuite({
        organization: input.readinessResult.target.organization,
        project: input.readinessResult.target.project,
        testPlanId: input.readinessResult.target.testPlanId as string | number,
        testSuiteId: input.readinessResult.target.testSuiteId as string | number,
        testCaseId: created.id
      });

      createdItems.push({
        reviewedCaseId: candidate.reviewedCaseId,
        originalDraftId: candidate.originalDraftId,
        title: candidate.title,
        azureWorkItemId: created.id,
        azureWorkItemUrl: created.url,
        testPlanId: input.readinessResult.target.testPlanId as string | number,
        testSuiteId: input.readinessResult.target.testSuiteId as string | number,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      failedItems.push({
        reviewedCaseId: candidate.reviewedCaseId,
        originalDraftId: candidate.originalDraftId,
        title: candidate.title,
        reason: "Test case was created in Azure, but adding it to the selected suite failed.",
        azureWorkItemId: created.id,
        azureWorkItemUrl: created.url,
        partiallyCreated: true
      });
    }
  }

  return {
    mode: "explicit-confirmation",
    status: getCreationStatus(createdItems, failedItems),
    startedAt,
    completedAt: new Date().toISOString(),
    target: input.readinessResult.target,
    createdItems,
    failedItems,
    skippedItems,
    disclaimer: TEST_PLANS_CREATION_DISCLAIMER
  };
}

function buildSkippedItems(
  candidates: TestPlansExportCandidate[],
  selectedIds: Set<string>
): TestPlansSkippedItem[] {
  return candidates
    .filter((candidate) => !selectedIds.has(candidate.reviewedCaseId) && !selectedIds.has(candidate.originalDraftId))
    .map((candidate) => ({
      reviewedCaseId: candidate.reviewedCaseId,
      originalDraftId: candidate.originalDraftId,
      title: candidate.title,
      reason: "Candidate was not selected for this explicit creation request."
    }));
}

function getCreationStatus(
  createdItems: TestPlansCreatedItem[],
  failedItems: TestPlansCreationFailure[]
): TestPlansCreationResult["status"] {
  if (createdItems.length > 0 && failedItems.length === 0) {
    return "created";
  }

  if (createdItems.length > 0 && failedItems.length > 0) {
    return "partial-success";
  }

  return "failed";
}

function sanitizeCreationError(error: unknown): string {
  if (error instanceof AzureDevOpsIntegrationError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return "Azure Test Plans creation failed for this candidate.";
  }

  return "Azure Test Plans creation failed for this candidate.";
}

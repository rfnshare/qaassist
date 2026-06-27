import type { FastifyInstance } from "fastify";
import type {
  ReviewedTestCase,
  TestCaseDraftGenerationResult,
  TestCaseReviewNormalizationRequest
} from "@qa-assist/shared";
import { normalizeTestCaseReviewSession } from "../test-cases/testCaseReview.service.js";

type TestCaseReviewBody = {
  workItem?: unknown;
  draftResult?: unknown;
  reviewedCases?: unknown;
};

export async function registerTestCaseReviewRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: TestCaseReviewBody }>("/test-cases/review/normalize", async (request) => {
    const reviewRequest = validateTestCaseReviewBody(request.body);

    return normalizeTestCaseReviewSession(reviewRequest);
  });
}

function validateTestCaseReviewBody(body: TestCaseReviewBody | undefined): TestCaseReviewNormalizationRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  if (!isObject(body.workItem)) {
    throw badRequest("workItem is required.");
  }

  const workItemId = Number(body.workItem.workItemId);
  if (!Number.isSafeInteger(workItemId) || workItemId <= 0) {
    throw badRequest("workItem.workItemId must be a positive integer.");
  }

  if (!isNonEmptyString(body.workItem.title)) {
    throw badRequest("workItem.title is required.");
  }

  if (!isObject(body.draftResult)) {
    throw badRequest("draftResult is required.");
  }

  if (!Array.isArray(body.draftResult.draftCases)) {
    throw badRequest("draftResult.draftCases must be an array.");
  }

  if (!Array.isArray(body.reviewedCases)) {
    throw badRequest("reviewedCases must be an array.");
  }

  return {
    workItem: {
      workItemId,
      title: body.workItem.title.trim()
    },
    draftResult: body.draftResult as TestCaseDraftGenerationResult,
    reviewedCases: body.reviewedCases as ReviewedTestCase[]
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

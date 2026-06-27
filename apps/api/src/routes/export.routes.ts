import type { FastifyInstance } from "fastify";
import type { ReviewExportFormat, ReviewExportRequest, ReviewExportSection } from "@qa-assist/shared";
import { buildReviewExportPackage } from "../export/reviewExport.service.js";

type ReviewExportBody = Partial<Record<keyof ReviewExportRequest, unknown>>;

const FORMATS: ReviewExportFormat[] = ["json", "markdown"];
const SECTIONS: ReviewExportSection[] = [
  "story-context",
  "story-analysis",
  "ai-assist",
  "draft-cases",
  "review-session",
  "test-plans-readiness",
  "test-plans-creation",
  "automation-candidates"
];
const SENSITIVE_BODY_KEYS = new Set(["pat", "token", "authorization", "password", "secret", "apikey", "api_key"]);

export async function registerExportRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ReviewExportBody }>("/export/review-package", async (request) => {
    const input = validateReviewExportBody(request.body);

    return buildReviewExportPackage(input);
  });
}

function validateReviewExportBody(body: ReviewExportBody | undefined): ReviewExportRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  if (containsSensitiveKey(body)) {
    throw badRequest("Request body must not include secrets or tokens.");
  }

  if (!FORMATS.includes(body.format as ReviewExportFormat)) {
    throw badRequest("format must be json or markdown.");
  }

  if (!Array.isArray(body.selectedSections)) {
    throw badRequest("selectedSections must be an array.");
  }

  if (body.selectedSections.length === 0) {
    throw badRequest("selectedSections must not be empty.");
  }

  const selectedSections = body.selectedSections.map((section, index) => {
    if (!SECTIONS.includes(section as ReviewExportSection)) {
      throw badRequest(`selectedSections[${index}] is invalid.`);
    }

    return section as ReviewExportSection;
  });

  return {
    format: body.format as ReviewExportFormat,
    selectedSections: Array.from(new Set(selectedSections)),
    workItemDetail: body.workItemDetail as ReviewExportRequest["workItemDetail"],
    storyAnalysis: body.storyAnalysis as ReviewExportRequest["storyAnalysis"],
    aiAssistResult: body.aiAssistResult as ReviewExportRequest["aiAssistResult"],
    draftResult: body.draftResult as ReviewExportRequest["draftResult"],
    reviewSession: body.reviewSession as ReviewExportRequest["reviewSession"],
    readinessResult: body.readinessResult as ReviewExportRequest["readinessResult"],
    creationResult: body.creationResult as ReviewExportRequest["creationResult"],
    automationMappingResult: body.automationMappingResult as ReviewExportRequest["automationMappingResult"]
  };
}

function containsSensitiveKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsSensitiveKey);
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.entries(value).some(([key, child]) =>
    SENSITIVE_BODY_KEYS.has(key.toLowerCase()) || containsSensitiveKey(child)
  );
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

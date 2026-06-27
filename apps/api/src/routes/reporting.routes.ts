import type { FastifyInstance } from "fastify";
import type { TeamAnalyticsRequest } from "@qa-assist/shared";
import { buildTeamAnalytics } from "../reporting/teamAnalytics.service.js";

type TeamAnalyticsBody = Partial<Record<keyof TeamAnalyticsRequest, unknown>>;

const MEANINGFUL_INPUT_KEYS: Array<keyof TeamAnalyticsRequest> = [
  "boardSummary",
  "briefing",
  "workItemDetail",
  "storyAnalysis",
  "reviewSession",
  "readinessResult",
  "creationResult",
  "automationMappingResult",
  "automationScaffoldResult",
  "exportResult",
  "writebackPreviewResult",
  "storySummaries"
];

export async function registerReportingRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: TeamAnalyticsBody }>("/reporting/team-analytics", async (request) => {
    const input = validateTeamAnalyticsBody(request.body);

    return buildTeamAnalytics(input);
  });
}

function validateTeamAnalyticsBody(body: TeamAnalyticsBody | undefined): TeamAnalyticsRequest {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  if (containsSensitiveKey(body)) {
    throw badRequest("Request body must not include secrets or tokens.");
  }

  const hasMeaningfulInput = MEANINGFUL_INPUT_KEYS.some((key) => {
    const value = body[key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
  });

  if (!hasMeaningfulInput) {
    throw badRequest("At least one analytics input is required.");
  }

  return body as TeamAnalyticsRequest;
}

function containsSensitiveKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsSensitiveKey);
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.entries(value).some(([key, child]) =>
    /(pat|token|authorization|password|secret|apikey|api_key)/i.test(key) || containsSensitiveKey(child)
  );
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

import type { FastifyInstance } from "fastify";
import type { BoardScope, CurrentQaUserSettings, AzureDevOpsStateMapping } from "@qa-assist/shared";
import type { ApiEnv } from "../config/env.js";
import { createAzureDevOpsClient } from "../integrations/azure-devops/azureDevOpsClient.js";
import { getAzureDevOpsRuntimeConfig } from "../integrations/azure-devops/azureDevOpsConfig.js";
import { fetchAzureDevOpsBoardSummaryPreview } from "../integrations/azure-devops/azureDevOpsBoardSummary.service.js";
import { fetchAzureDevOpsStates } from "../integrations/azure-devops/azureDevOpsState.service.js";

const DEFAULT_WORK_ITEM_TYPES = ["User Story", "Product Backlog Item", "Bug", "Task"];

type StatesQuery = {
  organization?: string;
  project?: string;
  workItemTypes?: string;
};

type BoardSummaryPreviewBody = {
  selectedBoard?: unknown;
  currentQaUser?: CurrentQaUserSettings;
  stateMapping?: AzureDevOpsStateMapping[];
  maxItems?: unknown;
};

export async function registerAzureDevOpsRoutes(app: FastifyInstance, env: ApiEnv): Promise<void> {
  const client = createAzureDevOpsClient(getAzureDevOpsRuntimeConfig(env));

  app.get<{ Querystring: StatesQuery }>("/azure-devops/states", async (request) => {
    const organization = requireQueryValue(request.query.organization, "organization");
    const project = requireQueryValue(request.query.project, "project");
    const workItemTypes = parseWorkItemTypes(request.query.workItemTypes);
    const workItemTypeStates = await fetchAzureDevOpsStates(client, { organization, project, workItemTypes });

    return {
      workItemTypeStates,
      stateOptions: workItemTypeStates.flatMap((entry) => entry.states)
    };
  });

  app.post<{ Body: BoardSummaryPreviewBody }>("/azure-devops/board-summary/preview", async (request) => {
    const validatedBody = validateBoardSummaryPreviewBody(request.body);

    return fetchAzureDevOpsBoardSummaryPreview(client, {
      selectedBoard: validatedBody.selectedBoard,
      currentQaUser: request.body.currentQaUser,
      stateMapping: request.body.stateMapping,
      maxItems: validatedBody.maxItems
    });
  });
}

function validateBoardSummaryPreviewBody(body: BoardSummaryPreviewBody | undefined): {
  selectedBoard: BoardScope;
  maxItems?: number;
} {
  if (!body?.selectedBoard || typeof body.selectedBoard !== "object") {
    throw badRequest("selectedBoard is required.");
  }

  const selectedBoard = body.selectedBoard as Record<string, unknown>;

  if (selectedBoard.source !== "azure-devops") {
    throw badRequest("selectedBoard.source must be azure-devops.");
  }

  if (!isNonEmptyString(selectedBoard.organization)) {
    throw badRequest("selectedBoard.organization is required.");
  }

  if (!isNonEmptyString(selectedBoard.project)) {
    throw badRequest("selectedBoard.project is required.");
  }

  assertOptionalString(selectedBoard.team, "selectedBoard.team");
  assertOptionalString(selectedBoard.iterationPath, "selectedBoard.iterationPath");
  assertOptionalString(selectedBoard.board, "selectedBoard.board");
  assertOptionalString(selectedBoard.boardId, "selectedBoard.boardId");
  assertOptionalString(selectedBoard.projectId, "selectedBoard.projectId");

  if (body.maxItems !== undefined && !isPositiveInteger(body.maxItems)) {
    throw badRequest("maxItems must be a positive integer.");
  }

  return {
    selectedBoard: {
      source: "azure-devops",
      organization: selectedBoard.organization.trim(),
      project: selectedBoard.project.trim(),
      team: normalizeOptionalString(selectedBoard.team),
      iterationPath: normalizeOptionalString(selectedBoard.iterationPath),
      board: normalizeOptionalString(selectedBoard.board),
      boardId: normalizeOptionalString(selectedBoard.boardId),
      projectId: normalizeOptionalString(selectedBoard.projectId)
    },
    maxItems: body.maxItems
  };
}

function parseWorkItemTypes(value: string | undefined): string[] {
  if (!value) {
    return DEFAULT_WORK_ITEM_TYPES;
  }

  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_WORK_ITEM_TYPES;
}

function requireQueryValue(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw badRequest(`${name} is required.`);
  }

  return value.trim();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertOptionalString(value: unknown, name: string): void {
  if (value !== undefined && typeof value !== "string") {
    throw badRequest(`${name} must be a string.`);
  }
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value) && value > 0;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

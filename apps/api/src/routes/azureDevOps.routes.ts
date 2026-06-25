import type { FastifyInstance } from "fastify";
import type {
  AzureDevOpsConnectionInfo,
  AzureDevOpsStateMapping,
  BoardScope,
  CurrentQaUserSettings
} from "@qa-assist/shared";
import type { ApiEnv } from "../config/env.js";
import { createAzureDevOpsClient } from "../integrations/azure-devops/azureDevOpsClient.js";
import { getAzureDevOpsRuntimeConfig } from "../integrations/azure-devops/azureDevOpsConfig.js";
import { fetchAzureDevOpsBoardSummaryPreview } from "../integrations/azure-devops/azureDevOpsBoardSummary.service.js";
import { parseAzureDevOpsConnectionUrl } from "../integrations/azure-devops/azureDevOpsConnection.service.js";
import { listAzureDevOpsProjects, listAzureDevOpsTeams } from "../integrations/azure-devops/azureDevOpsDiscovery.service.js";
import { fetchAzureDevOpsStates } from "../integrations/azure-devops/azureDevOpsState.service.js";
import { fetchAzureDevOpsWorkItemDetail } from "../integrations/azure-devops/azureDevOpsWorkItemDetail.service.js";

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

type ConnectBody = {
  url?: unknown;
};

type ProjectsBody = {
  connection?: unknown;
};

type TeamsBody = {
  connection?: unknown;
  project?: unknown;
};

type WorkItemDetailBody = {
  organization?: unknown;
  project?: unknown;
  workItemId?: unknown;
  team?: unknown;
  url?: unknown;
};

export async function registerAzureDevOpsRoutes(app: FastifyInstance, env: ApiEnv): Promise<void> {
  const runtimeConfig = getAzureDevOpsRuntimeConfig(env);
  const client = createAzureDevOpsClient(runtimeConfig);

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

  app.post<{ Body: ConnectBody }>("/azure-devops/setup/connect", async (request) => {
    const url = requireBodyString(request.body?.url, "url");
    const parsedConnection = parseAzureDevOpsConnectionUrl(url, runtimeConfig);

    if (parsedConnection.mode === "team-foundation-server") {
      return {
        connection: {
          ...parsedConnection,
          status: "needs-attention",
          warnings: [
            ...(parsedConnection.warnings ?? []),
            "TFS URL parsed. Full TFS discovery is not active yet."
          ]
        },
        projects: []
      };
    }

    const projects = await listAzureDevOpsProjects(client, parsedConnection);

    return {
      connection: {
        ...parsedConnection,
        status: "connected",
        connectedAt: new Date().toISOString()
      },
      projects
    };
  });

  app.post<{ Body: ProjectsBody }>("/azure-devops/setup/projects", async (request) => {
    const connection = validateConnectionInfo(request.body?.connection);
    const projects = await listAzureDevOpsProjects(client, connection);

    return { projects };
  });

  app.post<{ Body: TeamsBody }>("/azure-devops/setup/teams", async (request) => {
    const connection = validateConnectionInfo(request.body?.connection);
    const project = requireBodyString(request.body?.project, "project");
    const teams = await listAzureDevOpsTeams(client, connection, project);

    return { teams };
  });

  app.post<{ Body: WorkItemDetailBody }>("/azure-devops/work-items/detail", async (request) => {
    const input = validateWorkItemDetailBody(request.body);
    const workItem = await fetchAzureDevOpsWorkItemDetail(client, {
      ...input,
      apiVersion: runtimeConfig.apiVersion
    });

    return {
      workItem,
      fetchedAt: workItem.evidence.fetchedAt
    };
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

function requireBodyString(value: unknown, name: string): string {
  if (!isNonEmptyString(value)) {
    throw badRequest(`${name} is required.`);
  }

  return value.trim();
}

function validateConnectionInfo(value: unknown): AzureDevOpsConnectionInfo {
  if (!value || typeof value !== "object") {
    throw badRequest("connection is required.");
  }

  const connection = value as Record<string, unknown>;

  if (connection.source !== "azure-devops") {
    throw badRequest("connection.source must be azure-devops.");
  }

  if (connection.mode !== "azure-devops-services" && connection.mode !== "team-foundation-server") {
    throw badRequest("connection.mode must be azure-devops-services or team-foundation-server.");
  }

  if (!isNonEmptyString(connection.sourceUrl)) {
    throw badRequest("connection.sourceUrl is required.");
  }

  if (!isNonEmptyString(connection.serverUrl)) {
    throw badRequest("connection.serverUrl is required.");
  }

  if (!isNonEmptyString(connection.displayLabel)) {
    throw badRequest("connection.displayLabel is required.");
  }

  if (connection.mode === "azure-devops-services" && !isNonEmptyString(connection.organization)) {
    throw badRequest("connection.organization is required for Azure DevOps Services discovery.");
  }

  assertOptionalString(connection.organization, "connection.organization");
  assertOptionalString(connection.collection, "connection.collection");
  assertOptionalString(connection.project, "connection.project");
  assertOptionalString(connection.connectedAt, "connection.connectedAt");

  return {
    source: "azure-devops",
    sourceUrl: connection.sourceUrl.trim(),
    serverUrl: connection.serverUrl.trim(),
    mode: connection.mode,
    status: connection.status === "connected" ? "connected" : "needs-attention",
    displayLabel: connection.displayLabel.trim(),
    organization: normalizeOptionalString(connection.organization),
    collection: normalizeOptionalString(connection.collection),
    project: normalizeOptionalString(connection.project),
    connectedAt: normalizeOptionalString(connection.connectedAt),
    warnings: Array.isArray(connection.warnings) ? connection.warnings.filter(isNonEmptyString) : undefined
  };
}

function validateWorkItemDetailBody(body: WorkItemDetailBody | undefined): {
  organization: string;
  project: string;
  workItemId: number;
  team?: string;
  url?: string;
} {
  if (!body || typeof body !== "object") {
    throw badRequest("request body is required.");
  }

  const organization = requireBodyString(body.organization, "organization");
  const project = requireBodyString(body.project, "project");
  const workItemId = parseWorkItemId(body.workItemId);

  if (!workItemId) {
    throw badRequest("workItemId must be a positive integer.");
  }

  assertOptionalString(body.team, "team");
  const url = normalizeOptionalAzureWorkItemUrl(body.url);

  return {
    organization,
    project,
    workItemId,
    team: normalizeOptionalString(body.team),
    url
  };
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

function normalizeOptionalAzureWorkItemUrl(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  assertOptionalString(value, "url");

  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    throw badRequest("url must be a valid Azure DevOps https URL.");
  }

  try {
    const parsedUrl = new URL(normalized);
    const host = parsedUrl.hostname.toLowerCase();
    const isAzureDevOpsHost = host === "dev.azure.com" || host.endsWith(".visualstudio.com");

    if (parsedUrl.protocol !== "https:" || !isAzureDevOpsHost) {
      throw badRequest("url must be a valid Azure DevOps https URL.");
    }

    return normalized;
  } catch (error) {
    if (isValidationError(error)) {
      throw error;
    }

    throw badRequest("url must be a valid Azure DevOps https URL.");
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value) && value > 0;
}

function parseWorkItemId(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

function isValidationError(error: unknown): error is Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "VALIDATION_ERROR";
}

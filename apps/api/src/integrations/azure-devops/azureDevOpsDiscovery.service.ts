import type {
  AzureDevOpsConnectionInfo,
  AzureDevOpsProjectOption,
  AzureDevOpsTeamOption
} from "@qa-assist/shared";
import type { AzureDevOpsClient } from "./azureDevOpsClient.js";

type AzureProject = {
  id?: string;
  name?: string;
  description?: string;
  url?: string;
};

type AzureTeam = {
  id?: string;
  name?: string;
  description?: string;
  url?: string;
};

type AzureListResponse<T> = {
  value?: T[];
};

export async function listAzureDevOpsProjects(
  client: AzureDevOpsClient,
  connection: AzureDevOpsConnectionInfo
): Promise<AzureDevOpsProjectOption[]> {
  assertAzureDevOpsServicesConnection(connection);

  const response = await client.request<AzureListResponse<AzureProject>>({
    organization: connection.organization,
    path: "projects"
  });

  return (response.value ?? [])
    .filter((project): project is AzureProject & { name: string } => Boolean(project.name?.trim()))
    .map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      url: project.url
    }));
}

export async function listAzureDevOpsTeams(
  client: AzureDevOpsClient,
  connection: AzureDevOpsConnectionInfo,
  project: string
): Promise<AzureDevOpsTeamOption[]> {
  assertAzureDevOpsServicesConnection(connection);

  if (!project.trim()) {
    throw validationError("project is required.");
  }

  const response = await client.request<AzureListResponse<AzureTeam>>({
    organization: connection.organization,
    path: `projects/${encodeURIComponent(project.trim())}/teams`
  });

  return (response.value ?? [])
    .filter((team): team is AzureTeam & { name: string } => Boolean(team.name?.trim()))
    .map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      url: team.url,
      projectName: project.trim()
    }));
}

function assertAzureDevOpsServicesConnection(
  connection: AzureDevOpsConnectionInfo
): asserts connection is AzureDevOpsConnectionInfo & { organization: string } {
  if (connection.mode !== "azure-devops-services" || !connection.organization?.trim()) {
    throw validationError("Azure DevOps Services organization is required for discovery.");
  }
}

function validationError(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR"; exposeMessage: true } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR"; exposeMessage: true };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  error.exposeMessage = true;
  return error;
}

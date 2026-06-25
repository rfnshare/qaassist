import type { AzureWorkItemDetail } from "@qa-assist/shared";
import type { AzureDevOpsClient } from "./azureDevOpsClient.js";
import {
  type AzureWorkItemDetailResponse,
  mapAzureWorkItemDetail
} from "./azureDevOpsWorkItemDetail.mapper.js";

export type AzureWorkItemDetailInput = {
  organization: string;
  project: string;
  workItemId: number;
  apiVersion: string;
  url?: string;
};

export async function fetchAzureDevOpsWorkItemDetail(
  client: AzureDevOpsClient,
  input: AzureWorkItemDetailInput
): Promise<AzureWorkItemDetail> {
  const item = await client.request<AzureWorkItemDetailResponse>({
    organization: input.organization,
    project: input.project,
    path: `wit/workitems/${input.workItemId}`,
    query: {
      "$expand": "Relations"
    }
  });

  return mapAzureWorkItemDetail(item, {
    organization: input.organization,
    project: input.project,
    apiVersion: input.apiVersion,
    fetchedAt: new Date().toISOString(),
    fallbackUrl: input.url
  });
}

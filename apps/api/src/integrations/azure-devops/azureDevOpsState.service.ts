import type { AzureDevOpsStateOption } from "@qa-assist/shared";
import type { AzureDevOpsClient } from "./azureDevOpsClient.js";
import { mapAzureStateOption } from "./azureDevOpsMappers.js";

type AzureStatesResponse = {
  value?: Array<{
    name: string;
    color?: string;
    category?: string;
  }>;
};

export type AzureDevOpsStatesByType = {
  workItemType: string;
  states: AzureDevOpsStateOption[];
};

export async function fetchAzureDevOpsStates(
  client: AzureDevOpsClient,
  input: { organization: string; project: string; workItemTypes: string[] }
): Promise<AzureDevOpsStatesByType[]> {
  const results = await Promise.all(
    input.workItemTypes.map(async (workItemType) => {
      const response = await client.request<AzureStatesResponse>({
        organization: input.organization,
        project: input.project,
        path: `wit/workitemtypes/${encodeURIComponent(workItemType)}/states`
      });

      return {
        workItemType,
        states: (response.value ?? []).map((state) => mapAzureStateOption(state, workItemType))
      };
    })
  );

  return results;
}

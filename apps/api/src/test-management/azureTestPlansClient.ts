import { Buffer } from "node:buffer";
import { AzureDevOpsIntegrationError, missingAzureDevOpsTokenError } from "../integrations/azure-devops/azureDevOpsErrors.js";
import type { AzureDevOpsRuntimeConfig } from "../integrations/azure-devops/azureDevOpsConfig.js";
import type { TestPlansPreviewFields } from "@qa-assist/shared";

export type AzureTestPlansClient = {
  createTestCase(input: AzureTestCaseCreateInput): Promise<AzureTestCaseCreateResult>;
  addTestCaseToSuite(input: AzureTestCaseSuiteAddInput): Promise<void>;
};

export type AzureTestCaseCreateInput = {
  organization: string;
  project: string;
  title: string;
  previewFields: TestPlansPreviewFields;
};

export type AzureTestCaseCreateResult = {
  id: number;
  url?: string;
};

export type AzureTestCaseSuiteAddInput = {
  organization: string;
  project: string;
  testPlanId: string | number;
  testSuiteId: string | number;
  testCaseId: number;
};

type AzureWorkItemResponse = {
  id?: number;
  url?: string;
  _links?: {
    html?: {
      href?: string;
    };
  };
};

export function createAzureTestPlansClient(config: AzureDevOpsRuntimeConfig): AzureTestPlansClient {
  return {
    async createTestCase(input) {
      if (!config.pat) {
        throw missingAzureDevOpsTokenError();
      }

      const response = await azureRequest<AzureWorkItemResponse>(config, {
        organization: input.organization,
        project: input.project,
        path: "wit/workitems/$Test%20Case",
        method: "PATCH",
        contentType: "application/json-patch+json",
        body: buildTestCasePatch(input.title, input.previewFields)
      });

      if (!Number.isSafeInteger(response.id) || !response.id) {
        throw new AzureDevOpsIntegrationError("Azure DevOps did not return a created test case ID.", {
          statusCode: 502,
          code: "UPSTREAM_ERROR"
        });
      }

      return {
        id: response.id,
        url: response._links?.html?.href ?? response.url
      };
    },

    async addTestCaseToSuite(input) {
      if (!config.pat) {
        throw missingAzureDevOpsTokenError();
      }

      await azureRequest<unknown>(config, {
        organization: input.organization,
        project: input.project,
        path: `testplan/Plans/${encodeURIComponent(String(input.testPlanId))}/Suites/${encodeURIComponent(String(input.testSuiteId))}/TestCase`,
        method: "POST",
        contentType: "application/json",
        body: [
          {
            workItem: {
              id: input.testCaseId
            }
          }
        ]
      });
    }
  };
}

function buildTestCasePatch(title: string, previewFields: TestPlansPreviewFields): unknown[] {
  const patch = [
    {
      op: "add",
      path: "/fields/System.Title",
      value: title
    },
    {
      op: "add",
      path: "/fields/Microsoft.VSTS.TCM.Steps",
      value: buildStepsXml(previewFields)
    }
  ];

  if (previewFields.areaPath) {
    patch.push({
      op: "add",
      path: "/fields/System.AreaPath",
      value: previewFields.areaPath
    });
  }

  if (previewFields.iterationPath) {
    patch.push({
      op: "add",
      path: "/fields/System.IterationPath",
      value: previewFields.iterationPath
    });
  }

  return patch;
}

function buildStepsXml(previewFields: TestPlansPreviewFields): string {
  const stepsXml = previewFields.steps.map((step, index) => {
    const id = index + 1;
    return [
      `<step id="${id}" type="ActionStep">`,
      `<parameterizedString isformatted="true">${escapeXml(step.action)}</parameterizedString>`,
      `<parameterizedString isformatted="true">${escapeXml(step.expectedResult)}</parameterizedString>`,
      "<description/>",
      "</step>"
    ].join("");
  }).join("");

  const finalValidationStep = previewFields.expectedResult.trim()
    ? [
        `<step id="${previewFields.steps.length + 1}" type="ValidateStep">`,
        "<parameterizedString isformatted=\"true\">Validate final expected result.</parameterizedString>",
        `<parameterizedString isformatted="true">${escapeXml(previewFields.expectedResult)}</parameterizedString>`,
        "<description/>",
        "</step>"
      ].join("")
    : "";

  const lastStepId = previewFields.steps.length + (finalValidationStep ? 1 : 0);
  return `<steps id="0" last="${lastStepId}">${stepsXml}${finalValidationStep}</steps>`;
}

async function azureRequest<T>(
  config: AzureDevOpsRuntimeConfig,
  options: {
    organization: string;
    project: string;
    path: string;
    method: "PATCH" | "POST";
    contentType: string;
    body: unknown;
  }
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(buildUrl(config, options), {
      method: options.method,
      headers: {
        Authorization: buildBasicAuthHeader(config.pat ?? ""),
        "Content-Type": options.contentType
      },
      body: JSON.stringify(options.body),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new AzureDevOpsIntegrationError("Azure Test Plans request failed.", {
        statusCode: response.status >= 500 ? 502 : response.status,
        code: response.status === 401 || response.status === 403 ? "FORBIDDEN" : "UPSTREAM_ERROR"
      });
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AzureDevOpsIntegrationError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AzureDevOpsIntegrationError("Azure Test Plans request timed out.", {
        statusCode: 504,
        code: "UPSTREAM_ERROR"
      });
    }

    throw new AzureDevOpsIntegrationError("Azure Test Plans request could not be completed.", {
      statusCode: 502,
      code: "UPSTREAM_ERROR"
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildUrl(
  config: AzureDevOpsRuntimeConfig,
  options: {
    organization: string;
    project: string;
    path: string;
  }
): string {
  const url = new URL(
    `https://dev.azure.com/${encodeURIComponent(options.organization)}/${encodeURIComponent(options.project)}/_apis/${options.path}`
  );
  url.searchParams.set("api-version", config.apiVersion);
  return url.toString();
}

function buildBasicAuthHeader(pat: string): string {
  return `Basic ${Buffer.from(`:${pat}`).toString("base64")}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

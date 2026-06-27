import type { AutomationCandidateMappingResult } from "./automationCandidate.js";
import type { IsoDateTimeString } from "../common/timestamps.js";

export type AutomationScaffoldTarget =
  | "playwright-ui"
  | "api-test"
  | "mixed";

export type AutomationScaffoldStatus =
  | "preview-ready"
  | "needs-input"
  | "blocked";

export type AutomationScaffoldFile = {
  path: string;
  purpose: string;
  outline: string[];
  sampleSnippet?: string;
  ready: boolean;
};

export type AutomationScaffoldDependency = {
  name: string;
  purpose: string;
  required: boolean;
};

export type AutomationScaffoldGap = {
  code:
    | "SELECTORS_MISSING"
    | "TEST_DATA_MISSING"
    | "API_DETAILS_MISSING"
    | "ENVIRONMENT_MISSING"
    | "MANUAL_ONLY"
    | "CANDIDATE_BLOCKED";
  message: string;
  severity: "low" | "medium" | "high";
};

export type AutomationScaffoldOptions = {
  includeSelectors?: boolean;
  includeTestDataNotes?: boolean;
  includeApiClientShape?: boolean;
};

export type AutomationScaffoldRequest = {
  automationMappingResult: AutomationCandidateMappingResult;
  selectedCandidateIds: string[];
  scaffoldOptions?: AutomationScaffoldOptions;
};

export type AutomationScaffoldResult = {
  generatedAt: IsoDateTimeString;
  workItemId: number;
  workItemTitle: string;
  target: AutomationScaffoldTarget;
  status: AutomationScaffoldStatus;
  basedOnCandidateIds: string[];
  files: AutomationScaffoldFile[];
  dependencies: AutomationScaffoldDependency[];
  gaps: AutomationScaffoldGap[];
  warnings: string[];
  disclaimer: string;
};

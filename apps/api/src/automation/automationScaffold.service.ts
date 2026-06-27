import type {
  AutomationCandidate,
  AutomationScaffoldDependency,
  AutomationScaffoldFile,
  AutomationScaffoldGap,
  AutomationScaffoldOptions,
  AutomationScaffoldRequest,
  AutomationScaffoldResult,
  AutomationScaffoldStatus,
  AutomationScaffoldTarget
} from "@qa-assist/shared";

const DISCLAIMER = "Automation scaffold preview only. No code or repository changes have been created.";

export function buildAutomationScaffoldPreview(request: AutomationScaffoldRequest): AutomationScaffoldResult {
  const selectedCandidates = request.automationMappingResult.candidates.filter((candidate) =>
    request.selectedCandidateIds.includes(candidate.reviewedCaseId)
  );
  const target = chooseTarget(selectedCandidates);
  const gaps = selectedCandidates.flatMap((candidate) => buildCandidateGaps(candidate, request.scaffoldOptions ?? {}));
  const status = determineStatus(selectedCandidates, gaps);

  return {
    generatedAt: new Date().toISOString(),
    workItemId: request.automationMappingResult.workItemId,
    workItemTitle: request.automationMappingResult.workItemTitle,
    target,
    status,
    basedOnCandidateIds: selectedCandidates.map((candidate) => candidate.reviewedCaseId),
    files: status === "blocked" ? [] : buildFiles(request.automationMappingResult.workItemId, target, selectedCandidates, request.scaffoldOptions ?? {}),
    dependencies: buildDependencies(target),
    gaps,
    warnings: buildWarnings(selectedCandidates, status),
    disclaimer: DISCLAIMER
  };
}

function chooseTarget(candidates: AutomationCandidate[]): AutomationScaffoldTarget {
  if (candidates.some((candidate) => candidate.candidateType === "mixed")) {
    return "mixed";
  }

  if (candidates.some((candidate) => candidate.candidateType === "api")) {
    return candidates.some((candidate) => candidate.candidateType === "ui-playwright") ? "mixed" : "api-test";
  }

  return "playwright-ui";
}

function determineStatus(candidates: AutomationCandidate[], gaps: AutomationScaffoldGap[]): AutomationScaffoldStatus {
  if (candidates.every((candidate) => candidate.candidateType === "manual-only" || candidate.readiness === "blocked")) {
    return "blocked";
  }

  return gaps.some((gap) => gap.severity === "high" || gap.severity === "medium") ? "needs-input" : "preview-ready";
}

function buildCandidateGaps(candidate: AutomationCandidate, options: AutomationScaffoldOptions): AutomationScaffoldGap[] {
  const gaps: AutomationScaffoldGap[] = [];

  if (candidate.candidateType === "manual-only") {
    gaps.push({
      code: "MANUAL_ONLY",
      message: `${candidate.title} is marked manual-only and cannot produce an automation scaffold preview.`,
      severity: "high"
    });
  }

  if (candidate.readiness === "blocked" || !candidate.automatable) {
    gaps.push({
      code: "CANDIDATE_BLOCKED",
      message: `${candidate.title} is blocked for automation planning.`,
      severity: "high"
    });
  }

  if ((candidate.candidateType === "ui-playwright" || candidate.candidateType === "mixed") && !options.includeSelectors) {
    gaps.push({
      code: "SELECTORS_MISSING",
      message: `${candidate.title} needs stable selectors, page objects, or accessibility hooks before runnable UI automation can be created.`,
      severity: "medium"
    });
  }

  if ((candidate.candidateType === "api" || candidate.candidateType === "mixed") && !options.includeApiClientShape) {
    gaps.push({
      code: "API_DETAILS_MISSING",
      message: `${candidate.title} needs endpoint, payload, auth mode, and response contract details before runnable API automation can be created.`,
      severity: "medium"
    });
  }

  if (!options.includeTestDataNotes) {
    gaps.push({
      code: "TEST_DATA_MISSING",
      message: `${candidate.title} needs test data setup, cleanup, and environment assumptions before automation can be made reliable.`,
      severity: "low"
    });
  }

  if (candidate.blockers.length > 0) {
    gaps.push(...candidate.blockers.map((blocker) => ({
      code: "ENVIRONMENT_MISSING" as const,
      message: blocker.text,
      severity: blocker.severity
    })));
  }

  return gaps;
}

function buildFiles(
  workItemId: number,
  target: AutomationScaffoldTarget,
  candidates: AutomationCandidate[],
  options: AutomationScaffoldOptions
): AutomationScaffoldFile[] {
  const safeId = `story-${workItemId}`;
  const titles = candidates.map((candidate) => candidate.title);
  const files: AutomationScaffoldFile[] = [];

  if (target === "playwright-ui" || target === "mixed") {
    files.push({
      path: `tests/${safeId}.spec.ts`,
      purpose: "Preview where selected UI automation tests would likely live.",
      outline: [
        `Describe ${titles.length} selected candidate(s).`,
        "Arrange required data and navigate to the affected page.",
        "Exercise reviewed steps from approved cases.",
        "Assert visible outcomes using confirmed selectors."
      ],
      sampleSnippet: `test.describe('${safeId}', () => { /* preview only */ });`,
      ready: Boolean(options.includeSelectors && options.includeTestDataNotes)
    });
    files.push({
      path: `pages/${safeId}.page.ts`,
      purpose: "Preview page object or selector helper shape.",
      outline: [
        "Define stable locators after product selectors are confirmed.",
        "Expose actions used by selected reviewed cases.",
        "Keep assertions in tests unless local pattern says otherwise."
      ],
      ready: Boolean(options.includeSelectors)
    });
  }

  if (target === "api-test" || target === "mixed") {
    files.push({
      path: `api/${safeId}.client.ts`,
      purpose: "Preview API client helper shape for service/API candidates.",
      outline: [
        "Define endpoint methods after API contract is confirmed.",
        "Accept test data fixtures instead of hard-coded private values.",
        "Return typed responses for assertions."
      ],
      sampleSnippet: `export async function call${toPascalCase(safeId)}Api() { /* preview only */ }`,
      ready: Boolean(options.includeApiClientShape)
    });
  }

  files.push({
    path: `fixtures/${safeId}.test-data.ts`,
    purpose: "Preview test data fixture notes for selected candidates.",
    outline: [
      "List required users, roles, records, and cleanup rules.",
      "Mark data assumptions that need QA/product confirmation.",
      "Avoid storing secrets or customer data in fixtures."
    ],
    ready: Boolean(options.includeTestDataNotes)
  });

  return files;
}

function buildDependencies(target: AutomationScaffoldTarget): AutomationScaffoldDependency[] {
  const dependencies: AutomationScaffoldDependency[] = [
    {
      name: "Approved reviewed test cases",
      purpose: "Source of the automation intent.",
      required: true
    },
    {
      name: "Stable test data strategy",
      purpose: "Avoid brittle automation and private/customer data in tests.",
      required: true
    }
  ];

  if (target === "playwright-ui" || target === "mixed") {
    dependencies.push({
      name: "Playwright",
      purpose: "Future UI browser automation runtime.",
      required: true
    });
  }

  if (target === "api-test" || target === "mixed") {
    dependencies.push({
      name: "API contract details",
      purpose: "Endpoint, payload, auth, and response expectations for future API tests.",
      required: true
    });
  }

  return dependencies;
}

function buildWarnings(candidates: AutomationCandidate[], status: AutomationScaffoldStatus): string[] {
  const warnings = [
    "Preview only - no automation code, repository files, or CI/CD configuration were created.",
    "Scaffold paths and functions are planning metadata, not runnable tests."
  ];

  if (status !== "preview-ready") {
    warnings.push("Resolve gaps before treating this scaffold as ready for future generation.");
  }

  if (candidates.some((candidate) => candidate.evidenceLinks.length === 0)) {
    warnings.push("At least one selected candidate has no evidence links; confirm the automation scope manually.");
  }

  return warnings;
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

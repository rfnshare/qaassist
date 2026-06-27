import type {
  TeamAnalyticsMetric,
  TeamAnalyticsRequest,
  TeamAnalyticsResult,
  TeamAnalyticsScope,
  TeamAnalyticsSection,
  TeamAnalyticsStorySummary,
  TeamAnalyticsWarning
} from "@qa-assist/shared";

const DISCLAIMER =
  "Team analytics is a read-only summary of the current QA Assist session inputs. It does not imply complete board history or any external system changes.";

export function buildTeamAnalytics(input: TeamAnalyticsRequest): TeamAnalyticsResult {
  const scope = buildScope(input);
  const warnings = buildWarnings(input);

  return {
    generatedAt: new Date().toISOString(),
    scope,
    metrics: buildMetrics(input),
    sections: buildSections(input),
    storySummaries: buildStorySummaries(input),
    warnings,
    disclaimer: DISCLAIMER
  };
}

function buildScope(input: TeamAnalyticsRequest): TeamAnalyticsScope {
  if (input.scope) {
    return input.scope;
  }

  const selectedBoard = input.boardSummary?.selectedBoard;
  if (selectedBoard) {
    return {
      selectedBoard,
      label: `${selectedBoard.organization}/${selectedBoard.project}/${selectedBoard.team}`,
      scopeType: "selected-board"
    };
  }

  return {
    label: "Current QA Assist session",
    scopeType: "current-session"
  };
}

function buildMetrics(input: TeamAnalyticsRequest): TeamAnalyticsMetric[] {
  const review = input.reviewSession?.summary;
  const readiness = input.readinessResult;
  const creation = input.creationResult;
  const automation = input.automationMappingResult;

  return [
    metric("stories-analyzed", "Stories analyzed", input.storyAnalysis || input.workItemDetail ? 1 : 0, "Story analysis/detail inputs"),
    metric("reviewed-cases", "Reviewed cases", review?.totalReviewed ?? 0, "Review session"),
    metric("approved-for-export", "Approved for export", review?.readyForExport ?? 0, "Review session"),
    metric("rejected-cases", "Rejected cases", review?.rejected ?? 0, "Review session"),
    metric("blocked-cases", "Blocked cases", review?.blocked ?? 0, "Review session"),
    metric("readiness-candidates", "Readiness candidates", readiness?.candidates.length ?? 0, "Azure Test Plans readiness preview"),
    metric("azure-created-items", "Azure created items", creation?.createdItems.length ?? 0, "Explicit Azure Test Plans creation result"),
    metric("azure-failed-items", "Azure failed items", creation?.failedItems.length ?? 0, "Explicit Azure Test Plans creation result"),
    metric("automation-candidates", "Automation candidates", automation?.summary.candidateCount ?? 0, "Automation mapping"),
    metric("automation-ready", "Automation ready", automation?.summary.readyCount ?? 0, "Automation mapping"),
    metric("exports-generated", "Exports generated", input.exportResult ? 1 : 0, "Review package export"),
    metric("writeback-previews", "Write-back previews", input.writebackPreviewResult ? 1 : 0, "Write-back helper preview")
  ];
}

function buildSections(input: TeamAnalyticsRequest): TeamAnalyticsSection[] {
  return [
    {
      id: "board-overview",
      title: "Board overview",
      summary: input.boardSummary
        ? `Board preview is ${input.boardSummary.connectionStatus}; ${input.boardSummary.myWork.length} assigned item(s) and ${input.boardSummary.resolvedBugsReadyToRetest.length} ready-to-retest item(s) are present in the current preview.`
        : "No board preview was provided for this analytics run.",
      items: input.boardSummary
        ? [
            `Generated: ${input.boardSummary.generatedAt}`,
            `Data freshness: ${input.boardSummary.dataFreshness ?? "not returned"}`,
            `Open risks: ${input.boardSummary.openRisks.length}`
          ]
        : []
    },
    {
      id: "review-progress",
      title: "Review progress",
      summary: input.reviewSession
        ? `${input.reviewSession.summary.totalReviewed} reviewed case(s), ${input.reviewSession.summary.readyForExport} ready for export, ${input.reviewSession.summary.blocked} blocked.`
        : "No reviewed test case session was provided.",
      items: input.reviewSession
        ? [
            `Approved: ${input.reviewSession.summary.approved}`,
            `Rejected: ${input.reviewSession.summary.rejected}`,
            `Needs review: ${input.reviewSession.summary.needsReview}`,
            ...input.reviewSession.summary.warnings
          ]
        : []
    },
    {
      id: "test-plans-outcomes",
      title: "Test Plans outcomes",
      summary: input.creationResult
        ? `${input.creationResult.createdItems.length} created, ${input.creationResult.failedItems.length} failed, ${input.creationResult.skippedItems.length} skipped.`
        : input.readinessResult
          ? `${input.readinessResult.candidates.length} readiness candidate(s); status ${input.readinessResult.status}.`
          : "No Test Plans readiness or creation result was provided.",
      items: [
        ...(input.readinessResult ? [`Readiness: ${input.readinessResult.status}`, `Blocked readiness items: ${input.readinessResult.blockedItems.length}`] : []),
        ...(input.creationResult ? [`Creation status: ${input.creationResult.status}`, `Target: ${input.creationResult.target.organization}/${input.creationResult.target.project}/${input.creationResult.target.team}`] : [])
      ]
    },
    {
      id: "automation-outlook",
      title: "Automation outlook",
      summary: input.automationMappingResult
        ? `${input.automationMappingResult.summary.candidateCount} automation candidate(s), ${input.automationMappingResult.summary.readyCount} ready, ${input.automationMappingResult.summary.manualOnlyCount} manual-only.`
        : "No automation mapping was provided.",
      items: [
        ...(input.automationMappingResult
          ? [
              `Needs work: ${input.automationMappingResult.summary.needsWorkCount}`,
              `Blocked: ${input.automationMappingResult.summary.blockedCount}`
            ]
          : []),
        ...(input.automationScaffoldResult
          ? [`Scaffold status: ${input.automationScaffoldResult.status}`, `Scaffold files previewed: ${input.automationScaffoldResult.files.length}`]
          : [])
      ]
    },
    {
      id: "exports-and-writeback-previews",
      title: "Exports and write-back previews",
      summary: `${input.exportResult ? "Export package generated" : "No export package provided"}; ${input.writebackPreviewResult ? "write-back helper preview prepared" : "no write-back helper preview provided"}.`,
      items: [
        ...(input.exportResult ? [`Export format: ${input.exportResult.artifact.format}`, `Included sections: ${input.exportResult.summary.includedSections.length}`] : []),
        ...(input.writebackPreviewResult ? [`Write-back helper: ${input.writebackPreviewResult.helperType}`, `Preview status: ${input.writebackPreviewResult.status}`] : [])
      ]
    }
  ];
}

function buildStorySummaries(input: TeamAnalyticsRequest): TeamAnalyticsStorySummary[] {
  if (input.storySummaries?.length) {
    return input.storySummaries;
  }

  const workItemId = input.workItemDetail?.workItemId ?? input.storyAnalysis?.workItemId ?? input.reviewSession?.workItemId;
  if (!workItemId) {
    return [];
  }

  return [{
    workItemId,
    title: input.workItemDetail?.title ?? input.reviewSession?.workItemTitle,
    state: input.workItemDetail?.state,
    reviewedTotal: input.reviewSession?.summary.totalReviewed,
    approvedForExport: input.reviewSession?.summary.readyForExport,
    blocked: input.reviewSession?.summary.blocked,
    readinessStatus: input.readinessResult?.status,
    azureCreationStatus: input.creationResult?.status,
    automationReadinessSummary: input.automationMappingResult
      ? `${input.automationMappingResult.summary.readyCount} ready / ${input.automationMappingResult.summary.candidateCount} candidates`
      : undefined
  }];
}

function buildWarnings(input: TeamAnalyticsRequest): TeamAnalyticsWarning[] {
  const warnings: TeamAnalyticsWarning[] = [{
    code: "SESSION_ONLY",
    message: "Analytics use only the current request/session inputs and are not full historical reporting."
  }];

  if (!input.boardSummary) warnings.push(warning("MISSING_BOARD_DATA", "No board summary was provided; board metrics are limited."));
  if (!input.reviewSession) warnings.push(warning("MISSING_REVIEW_DATA", "No review session was provided; review progress metrics are limited."));
  if (!input.readinessResult && !input.creationResult) warnings.push(warning("MISSING_TEST_PLANS_DATA", "No Test Plans readiness or creation result was provided."));
  if (!input.automationMappingResult) warnings.push(warning("MISSING_AUTOMATION_DATA", "No automation mapping was provided."));
  if (!input.exportResult && !input.writebackPreviewResult) warnings.push(warning("MISSING_EXPORT_WRITEBACK_DATA", "No export package or write-back preview was provided."));

  return warnings;
}

function metric(id: string, label: string, value: number | string, source: string): TeamAnalyticsMetric {
  return { id, label, value, source };
}

function warning(code: TeamAnalyticsWarning["code"], message: string): TeamAnalyticsWarning {
  return { code, message };
}

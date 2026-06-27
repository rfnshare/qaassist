import type {
  ReviewExportRequest,
  ReviewExportResult,
  ReviewExportSection
} from "@qa-assist/shared";

export const REVIEW_EXPORT_DISCLAIMER =
  "This export is a portable review package generated from the current QA Assist session. It does not imply any external system was updated unless explicitly stated in the included creation results.";

type ExportPayload = {
  generatedAt: string;
  disclaimer: string;
  labels: Record<string, string>;
  sections: Partial<Record<ReviewExportSection, unknown>>;
  warnings: string[];
};

export function buildReviewExportPackage(request: ReviewExportRequest): ReviewExportResult {
  const generatedAt = new Date().toISOString();
  const includedSections: ReviewExportSection[] = [];
  const warnings: string[] = [];
  const sections: ExportPayload["sections"] = {};

  for (const section of request.selectedSections) {
    const value = getSectionValue(section, request);

    if (value === undefined) {
      warnings.push(`${formatSectionLabel(section)} was selected but no session data was available, so it was skipped.`);
      continue;
    }

    sections[section] = value;
    includedSections.push(section);
  }

  if (includedSections.length === 0) {
    throw badRequest("At least one selected section must have exportable session data.");
  }

  const workItemId = request.workItemDetail?.workItemId ?? request.storyAnalysis?.workItemId ?? request.reviewSession?.workItemId;
  const title = request.workItemDetail?.title ?? request.storyAnalysis?.title ?? request.reviewSession?.workItemTitle;
  const fileName = buildFileName(workItemId, request.format);
  const payload: ExportPayload = {
    generatedAt,
    disclaimer: REVIEW_EXPORT_DISCLAIMER,
    labels: {
      storyAnalysis: "deterministic evidence-bound preview",
      aiAssist: "AI-assisted suggestion-only output",
      draftCases: "draft-only test case output",
      reviewSession: "reviewed local/session output",
      readiness: "Azure Test Plans readiness preview only",
      creation: "explicit Azure Test Plans creation result already attempted",
      automation: "automation planning only"
    },
    sections,
    warnings
  };

  const content = request.format === "json"
    ? JSON.stringify(payload, null, 2)
    : buildMarkdown(payload, workItemId, title);

  return {
    summary: {
      workItemId,
      title,
      includedSections,
      warnings,
      generatedAt
    },
    artifact: {
      fileName,
      mimeType: request.format === "json" ? "application/json" : "text/markdown",
      content,
      format: request.format
    },
    disclaimer: REVIEW_EXPORT_DISCLAIMER
  };
}

function getSectionValue(section: ReviewExportSection, request: ReviewExportRequest): unknown {
  switch (section) {
    case "story-context":
      return request.workItemDetail;
    case "story-analysis":
      return request.storyAnalysis;
    case "ai-assist":
      return request.aiAssistResult;
    case "draft-cases":
      return request.draftResult;
    case "review-session":
      return request.reviewSession;
    case "test-plans-readiness":
      return request.readinessResult;
    case "test-plans-creation":
      return request.creationResult;
    case "automation-candidates":
      return request.automationMappingResult;
  }
}

function buildMarkdown(payload: ExportPayload, workItemId: number | undefined, title: string | undefined): string {
  const lines = [
    "# QA Assist Review Package",
    "",
    `Generated: ${payload.generatedAt}`,
    workItemId ? `Work item: #${workItemId}` : undefined,
    title ? `Title: ${title}` : undefined,
    "",
    `> ${payload.disclaimer}`,
    "",
    "## Trust Labels",
    ...Object.entries(payload.labels).map(([key, value]) => `- ${key}: ${value}`),
    ""
  ].filter((line): line is string => line !== undefined);

  if (payload.warnings.length > 0) {
    lines.push("## Export Warnings", ...payload.warnings.map((warning) => `- ${warning}`), "");
  }

  for (const [section, value] of Object.entries(payload.sections)) {
    lines.push(`## ${formatSectionLabel(section as ReviewExportSection)}`);
    lines.push("```json");
    lines.push(JSON.stringify(value, null, 2));
    lines.push("```");
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

function buildFileName(workItemId: number | undefined, format: ReviewExportRequest["format"]): string {
  const suffix = format === "json" ? "json" : "md";
  return `qa-assist-review-${workItemId ?? "session"}.${suffix}`;
}

function formatSectionLabel(section: ReviewExportSection): string {
  return section.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

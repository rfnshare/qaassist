import type {
  AttachmentMetadataDraft,
  BugDraftPayload,
  CommentDraftPayload,
  StateTransitionDraftPayload,
  WritebackPreviewRequest,
  WritebackPreviewResult,
  WritebackPreviewStatus,
  WritebackValidationWarning
} from "@qa-assist/shared";

export const WRITEBACK_PREVIEW_DISCLAIMER =
  "Write-back helper preview only. Nothing has been created or updated in Azure DevOps.";

export function buildWritebackPreview(request: WritebackPreviewRequest): WritebackPreviewResult {
  switch (request.helperType) {
    case "bug-draft":
      return buildResult(request.helperType, buildBugDraft(request));
    case "comment-draft":
      return buildResult(request.helperType, buildCommentDraft(request));
    case "state-transition":
      return buildResult(request.helperType, buildTransitionDraft(request));
    case "attachment-metadata":
      return buildResult(request.helperType, buildAttachmentDraft(request));
  }
}

function buildBugDraft(request: WritebackPreviewRequest): {
  preview: BugDraftPayload;
  warnings: WritebackValidationWarning[];
  status: WritebackPreviewStatus;
} {
  const workItem = request.workItemDetail;
  const selectedCase = request.reviewSession?.reviewedCases.find((reviewCase) =>
    reviewCase.status === "approved-for-export" || reviewCase.status === "edited" || reviewCase.status === "needs-review"
  );
  const warnings = baseWarnings();

  if (!workItem) {
    warnings.push(missingInput("workItemDetail is required for bug draft preview."));
  }

  if (!request.userNotes?.trim()) {
    warnings.push(needsConfirmation("Add user notes describing the actual result before submitting a bug."));
  }

  if (!selectedCase && !request.selectedEvidence?.length) {
    warnings.push(weakEvidence("No reviewed case or selected evidence was provided for the bug draft."));
  }

  const preview: BugDraftPayload = {
    title: `Bug draft: ${workItem?.title ?? selectedCase?.reviewedTitle ?? "Untitled issue"}`,
    reproSteps: selectedCase?.reviewedSteps.map((step) => `${step.order}. ${step.action}`).join("\n")
      ?? request.userNotes?.trim()
      ?? "Add reproduction steps before submission.",
    expectedResult: selectedCase?.reviewedExpectedResult ?? "Add expected result before submission.",
    actualResult: request.userNotes?.trim() ?? "Add actual result before submission.",
    severity: workItem?.severity,
    priority: workItem?.priority,
    relatedWorkItemId: workItem?.workItemId ?? request.reviewSession?.workItemId ?? 0,
    evidenceSummary: buildEvidenceSummary(request),
    warnings
  };

  return {
    preview,
    warnings,
    status: warnings.some((warning) => warning.code === "MISSING_REQUIRED_INPUT") ? "blocked" : warnings.length > 1 ? "needs-confirmation" : "ready-for-review"
  };
}

function buildCommentDraft(request: WritebackPreviewRequest): {
  preview: CommentDraftPayload;
  warnings: WritebackValidationWarning[];
  status: WritebackPreviewStatus;
} {
  const workItemId = request.workItemDetail?.workItemId ?? request.reviewSession?.workItemId ?? 0;
  const warnings = baseWarnings();

  if (!workItemId) {
    warnings.push(missingInput("workItemDetail or reviewSession is required for comment preview."));
  }

  if (!request.userNotes?.trim() && !request.reviewSession) {
    warnings.push(needsConfirmation("Add notes or validate review decisions before posting a comment later."));
  }

  const preview: CommentDraftPayload = {
    workItemId,
    title: request.workItemDetail?.title ?? request.reviewSession?.workItemTitle,
    commentText: [
      "QA Assist preview comment:",
      request.userNotes?.trim(),
      request.reviewSession ? `Reviewed cases: ${request.reviewSession.summary.totalReviewed}; approved for later export: ${request.reviewSession.summary.readyForExport}.` : undefined,
      request.selectedEvidence?.length ? `Selected evidence: ${request.selectedEvidence.map((item) => item.label).join(", ")}.` : undefined,
      "Preview only - final submission is not implemented in this step."
    ].filter(Boolean).join("\n"),
    warnings
  };

  return {
    preview,
    warnings,
    status: workItemId ? warnings.length > 1 ? "needs-confirmation" : "ready-for-review" : "blocked"
  };
}

function buildTransitionDraft(request: WritebackPreviewRequest): {
  preview: StateTransitionDraftPayload;
  warnings: WritebackValidationWarning[];
  status: WritebackPreviewStatus;
} {
  const warnings = baseWarnings();
  const currentState = request.workItemDetail?.state;

  if (!request.workItemDetail) {
    warnings.push(missingInput("workItemDetail is required for state transition preview."));
  }

  if (!request.targetState?.trim()) {
    warnings.push(missingInput("targetState is required for state transition preview."));
  }

  const preview: StateTransitionDraftPayload = {
    workItemId: request.workItemDetail?.workItemId ?? 0,
    currentState: currentState ?? "Unknown",
    suggestedState: request.targetState?.trim() ?? "Select target state",
    reason: request.userNotes?.trim() ?? "Add a reason before final transition submission.",
    warnings
  };

  return {
    preview,
    warnings,
    status: warnings.some((warning) => warning.code === "MISSING_REQUIRED_INPUT") ? "blocked" : "needs-confirmation"
  };
}

function buildAttachmentDraft(request: WritebackPreviewRequest): {
  preview: AttachmentMetadataDraft;
  warnings: WritebackValidationWarning[];
  status: WritebackPreviewStatus;
} {
  const warnings = baseWarnings();
  warnings.push({ code: "METADATA_ONLY", message: "Attachment helper is metadata-only. File upload is not implemented in this step." });

  if (!request.attachmentMetadata?.fileName?.trim()) {
    warnings.push(missingInput("attachmentMetadata.fileName is required for attachment metadata preview."));
  }

  const preview: AttachmentMetadataDraft = {
    fileName: request.attachmentMetadata?.fileName?.trim() ?? "missing-file-name",
    contentType: request.attachmentMetadata?.contentType,
    sizeBytes: request.attachmentMetadata?.sizeBytes,
    sourceLabel: request.attachmentMetadata?.sourceLabel?.trim() || "User-provided evidence metadata",
    warnings
  };

  return {
    preview,
    warnings,
    status: request.attachmentMetadata?.fileName?.trim() ? "needs-confirmation" : "blocked"
  };
}

function buildResult<T extends WritebackPreviewResult["helperType"]>(
  helperType: T,
  draft: {
    preview: WritebackPreviewResult["preview"];
    warnings: WritebackValidationWarning[];
    status: WritebackPreviewStatus;
  }
): WritebackPreviewResult {
  return {
    helperType,
    status: draft.status,
    generatedAt: new Date().toISOString(),
    preview: draft.preview,
    warnings: draft.warnings,
    requiredConfirmations: [
      "Review every field before any future write-back submission.",
      "Confirm that the preview applies to the current Azure DevOps work item.",
      "Final submission is not implemented in this step."
    ],
    disclaimer: WRITEBACK_PREVIEW_DISCLAIMER
  };
}

function baseWarnings(): WritebackValidationWarning[] {
  return [{ code: "PREVIEW_ONLY", message: "Preview only - nothing will be written to Azure DevOps." }];
}

function buildEvidenceSummary(request: WritebackPreviewRequest): string {
  const selectedEvidence = request.selectedEvidence?.map((item) => item.summary || item.label).filter(Boolean) ?? [];
  const reviewEvidence = request.reviewSession?.reviewedCases
    .flatMap((reviewCase) => reviewCase.evidenceLinks.map((link) => link.label))
    .slice(0, 4) ?? [];
  const evidence = [...selectedEvidence, ...reviewEvidence];

  return evidence.length > 0 ? evidence.join("; ") : "Evidence needs QA confirmation before submission.";
}

function missingInput(message: string): WritebackValidationWarning {
  return { code: "MISSING_REQUIRED_INPUT", message };
}

function needsConfirmation(message: string): WritebackValidationWarning {
  return { code: "NEEDS_USER_CONFIRMATION", message };
}

function weakEvidence(message: string): WritebackValidationWarning {
  return { code: "WEAK_EVIDENCE", message };
}

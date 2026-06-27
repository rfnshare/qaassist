import type { IsoDateTimeString } from "../common/timestamps.js";
import type { TestCaseReviewSession } from "../test-cases/testCaseReview.js";
import type { WorkItemDetail } from "../work-items/workItemDetail.js";

export type WritebackHelperType =
  | "bug-draft"
  | "comment-draft"
  | "state-transition"
  | "attachment-metadata";

export type WritebackPreviewStatus =
  | "ready-for-review"
  | "needs-confirmation"
  | "blocked";

export type WritebackValidationWarning = {
  code:
    | "PREVIEW_ONLY"
    | "WEAK_EVIDENCE"
    | "MISSING_REQUIRED_INPUT"
    | "NEEDS_USER_CONFIRMATION"
    | "METADATA_ONLY";
  message: string;
};

export type BugDraftPayload = {
  title: string;
  reproSteps: string;
  expectedResult: string;
  actualResult: string;
  severity?: string;
  priority?: string | number;
  relatedWorkItemId: number;
  evidenceSummary: string;
  warnings: WritebackValidationWarning[];
};

export type CommentDraftPayload = {
  workItemId: number;
  title?: string;
  commentText: string;
  warnings: WritebackValidationWarning[];
};

export type StateTransitionDraftPayload = {
  workItemId: number;
  currentState: string;
  suggestedState: string;
  reason: string;
  warnings: WritebackValidationWarning[];
};

export type AttachmentMetadataDraft = {
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
  sourceLabel: string;
  warnings: WritebackValidationWarning[];
};

export type WritebackPreviewPayload =
  | BugDraftPayload
  | CommentDraftPayload
  | StateTransitionDraftPayload
  | AttachmentMetadataDraft;

export type WritebackSelectedEvidence = {
  id: string;
  label: string;
  summary?: string;
  source?: string;
};

export type WritebackPreviewRequest = {
  helperType: WritebackHelperType;
  workItemDetail?: WorkItemDetail;
  reviewSession?: TestCaseReviewSession;
  selectedEvidence?: WritebackSelectedEvidence[];
  userNotes?: string;
  targetState?: string;
  attachmentMetadata?: {
    fileName: string;
    contentType?: string;
    sizeBytes?: number;
    sourceLabel?: string;
  };
};

export type WritebackPreviewResult = {
  helperType: WritebackHelperType;
  status: WritebackPreviewStatus;
  generatedAt: IsoDateTimeString;
  preview: WritebackPreviewPayload;
  warnings: WritebackValidationWarning[];
  requiredConfirmations: string[];
  disclaimer: string;
};

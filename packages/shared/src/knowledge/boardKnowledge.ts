import type { IsoDateTimeString } from "../common/timestamps.js";
import type { BoardScope } from "../settings/azureDevOpsSettings.js";

export type BoardKnowledgeSourceType =
  | "requirement-document"
  | "meeting-transcript"
  | "ba-po-qa"
  | "product-rule"
  | "release-note"
  | "test-note"
  | "known-risk"
  | "automation-reference"
  | "other";

export type BoardKnowledgeSourceStatus =
  | "draft"
  | "metadata-only"
  | "uploaded"
  | "indexed"
  | "disabled"
  | "error";

export type BoardKnowledgeTrustLevel =
  | "source-backed"
  | "user-confirmed"
  | "assumption"
  | "needs-confirmation";

export type BoardKnowledgeScope = {
  organization: string;
  project: string;
  team: string;
  board?: string;
  iteration?: string;
};

export type BoardKnowledgeFileMetadata = {
  fileName: string;
  fileType?: string;
  sizeBytes?: number;
  addedAt: IsoDateTimeString;
  addedBy?: string;
};

export type BoardKnowledgeSource = {
  id: string;
  selectedBoard: BoardScope;
  scope: BoardKnowledgeScope;
  type: BoardKnowledgeSourceType;
  status: BoardKnowledgeSourceStatus;
  trustLevel: BoardKnowledgeTrustLevel;
  title: string;
  description?: string;
  file?: BoardKnowledgeFileMetadata;
  tags: string[];
  privacyNote: string;
  limitations: string[];
  evidenceLabel: string;
  addedAt: IsoDateTimeString;
  addedBy?: string;
};

export type BoardKnowledgeUploadDraft = {
  type: BoardKnowledgeSourceType;
  title: string;
  description?: string;
  file?: Omit<BoardKnowledgeFileMetadata, "addedAt">;
  tags?: string[];
  privacyNote?: string;
  limitations?: string[];
  addedBy?: string;
};

export type BoardKnowledgeSummary = {
  selectedBoard: BoardScope;
  generatedAt: IsoDateTimeString;
  totalSources: number;
  countByType: Partial<Record<BoardKnowledgeSourceType, number>>;
  countByStatus: Partial<Record<BoardKnowledgeSourceStatus, number>>;
  warnings: string[];
};

export type BoardKnowledgeBase = {
  selectedBoard: BoardScope;
  sources: BoardKnowledgeSource[];
  summary: BoardKnowledgeSummary;
  updatedAt: IsoDateTimeString;
};

export type BoardKnowledgeAccessScope =
  | "board"
  | "project"
  | "user-private";

export type BoardKnowledgeFileStatus = BoardKnowledgeSourceStatus;

export type BoardKnowledgeFile = BoardKnowledgeSource;

export type BoardKnowledgeSettings = {
  boardScope: BoardScope;
  sources: BoardKnowledgeSource[];
  enabled: boolean;
  updatedAt: IsoDateTimeString;
};

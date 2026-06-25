import type { IsoDateTimeString } from "../common/timestamps.js";
import type { BoardScope } from "../settings/azureDevOpsSettings.js";

export type BoardKnowledgeSourceType =
  | "requirement-document"
  | "meeting-transcript"
  | "qa-note"
  | "ba-answer"
  | "product-rule"
  | "other";

export type BoardKnowledgeFileStatus =
  | "pending"
  | "available"
  | "processing"
  | "disabled"
  | "deleted"
  | "error";

export type BoardKnowledgeAccessScope =
  | "board"
  | "project"
  | "user-private";

export type BoardKnowledgeFile = {
  boardScope: BoardScope;
  fileId: string;
  fileName: string;
  sourceType: BoardKnowledgeSourceType;
  contentType: string;
  sizeBytes: number;
  uploadedBy?: string;
  uploadedAt: IsoDateTimeString;
  status: BoardKnowledgeFileStatus;
  accessScope: BoardKnowledgeAccessScope;
  retentionPolicy?: string;
  sourceDescription?: string;
};

export type BoardKnowledgeSettings = {
  boardScope: BoardScope;
  files: BoardKnowledgeFile[];
  enabled: boolean;
  updatedAt: IsoDateTimeString;
};

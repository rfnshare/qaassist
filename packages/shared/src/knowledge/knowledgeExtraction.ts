import type { IsoDateTimeString } from "../common/timestamps.js";
import type { BoardScope } from "../settings/azureDevOpsSettings.js";
import type { BoardKnowledgeSourceType } from "./boardKnowledge.js";

export type KnowledgeExtractionContentKind =
  | "plain-text"
  | "markdown"
  | "unknown";

export type KnowledgeExtractionStatus =
  | "extracted"
  | "rejected"
  | "disabled"
  | "error";

export type KnowledgeExtractionWarning = {
  code:
    | "PREVIEW_TRUNCATED"
    | "NOT_ANALYZED"
    | "NOT_INDEXED"
    | "SIZE_MISMATCH"
    | "UNSUPPORTED_CONTENT_KIND";
  message: string;
};

export type KnowledgeExtractionPolicy = {
  acceptedContentKinds: KnowledgeExtractionContentKind[];
  acceptedFileExtensions: string[];
  unsupportedFileExtensions: string[];
  maxFileSizeBytes: number;
  textPreviewMaxCharacters: number;
  multipartUploadEnabled: false;
  persistenceEnabled: false;
  indexingEnabled: false;
  llmIngestionEnabled: false;
};

export type KnowledgeExtractionSourceInput = {
  id?: string;
  title: string;
  type?: BoardKnowledgeSourceType;
};

export type KnowledgeExtractionFileInput = {
  fileName: string;
  fileType?: string;
  sizeBytes?: number;
  textContent: string;
};

export type KnowledgeExtractionRequest = {
  selectedBoard: BoardScope;
  source: KnowledgeExtractionSourceInput;
  file: KnowledgeExtractionFileInput;
};

export type KnowledgeExtractionEvidence = {
  selectedBoard: BoardScope;
  sourceId?: string;
  sourceTitle: string;
  fileName: string;
  extractedAt: IsoDateTimeString;
  contentKind: KnowledgeExtractionContentKind;
  byteLength: number;
  characterLength: number;
  warnings: KnowledgeExtractionWarning[];
};

export type KnowledgeExtractedText = {
  textPreview: string;
  fullTextAvailable: boolean;
};

export type KnowledgeExtractionResult = {
  status: KnowledgeExtractionStatus;
  policy: KnowledgeExtractionPolicy;
  evidence?: KnowledgeExtractionEvidence;
  extractedText?: KnowledgeExtractedText;
  warnings: KnowledgeExtractionWarning[];
  limitations: string[];
};

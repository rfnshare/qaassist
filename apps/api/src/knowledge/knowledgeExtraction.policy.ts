import type { KnowledgeExtractionPolicy } from "@qa-assist/shared";

export const KNOWLEDGE_EXTRACTION_POLICY: KnowledgeExtractionPolicy = {
  acceptedContentKinds: ["plain-text", "markdown"],
  acceptedFileExtensions: [".txt", ".md"],
  unsupportedFileExtensions: [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg", ".gif", ".zip", ".exe"],
  maxFileSizeBytes: 256 * 1024,
  textPreviewMaxCharacters: 1500,
  multipartUploadEnabled: false,
  persistenceEnabled: false,
  indexingEnabled: false,
  llmIngestionEnabled: false
};

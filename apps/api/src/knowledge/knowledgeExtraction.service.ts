import { Buffer } from "node:buffer";
import type {
  KnowledgeExtractionContentKind,
  KnowledgeExtractionRequest,
  KnowledgeExtractionResult,
  KnowledgeExtractionWarning
} from "@qa-assist/shared";
import { KNOWLEDGE_EXTRACTION_POLICY } from "./knowledgeExtraction.policy.js";

export function extractKnowledgeText(request: KnowledgeExtractionRequest): KnowledgeExtractionResult {
  const fileName = request.file.fileName.trim();
  const contentKind = inferContentKind(fileName, request.file.fileType);
  const extension = getFileExtension(fileName);

  if (!KNOWLEDGE_EXTRACTION_POLICY.acceptedFileExtensions.includes(extension)) {
    throw badRequest("Only .txt and .md files are supported for extraction preview.");
  }

  if (!KNOWLEDGE_EXTRACTION_POLICY.acceptedContentKinds.includes(contentKind)) {
    throw badRequest("File content kind is not supported for extraction preview.");
  }

  if (request.file.sizeBytes !== undefined && request.file.sizeBytes > KNOWLEDGE_EXTRACTION_POLICY.maxFileSizeBytes) {
    throw badRequest("File size is above the extraction preview limit.");
  }

  const rawByteLength = Buffer.byteLength(request.file.textContent, "utf8");

  if (rawByteLength > KNOWLEDGE_EXTRACTION_POLICY.maxFileSizeBytes) {
    throw badRequest("Text content is above the extraction preview limit.");
  }

  if (looksBinary(request.file.textContent)) {
    throw badRequest("Text content looks binary or unsafe for text extraction preview.");
  }

  const normalizedText = normalizeText(request.file.textContent);
  const byteLength = Buffer.byteLength(normalizedText, "utf8");
  const characterLength = normalizedText.length;

  if (byteLength > KNOWLEDGE_EXTRACTION_POLICY.maxFileSizeBytes) {
    throw badRequest("Normalized text content is above the extraction preview limit.");
  }

  const warnings = buildWarnings(byteLength, request.file.sizeBytes, characterLength);
  const textPreview = normalizedText.slice(0, KNOWLEDGE_EXTRACTION_POLICY.textPreviewMaxCharacters);

  return {
    status: "extracted",
    policy: KNOWLEDGE_EXTRACTION_POLICY,
    evidence: {
      selectedBoard: request.selectedBoard,
      sourceId: request.source.id,
      sourceTitle: request.source.title.trim(),
      fileName,
      extractedAt: new Date().toISOString(),
      contentKind,
      byteLength,
      characterLength,
      warnings
    },
    extractedText: {
      textPreview,
      fullTextAvailable: characterLength <= KNOWLEDGE_EXTRACTION_POLICY.textPreviewMaxCharacters
    },
    warnings,
    limitations: [
      "Extraction preview is not stored, indexed, or analyzed.",
      "Extracted text is evidence preview only, not verified truth.",
      "Story analysis and board briefing do not use board knowledge extraction yet.",
      "PDF, DOCX, XLSX, images, archives, executable files, and multipart uploads are not supported in this step."
    ]
  };
}

function inferContentKind(fileName: string, fileType?: string): KnowledgeExtractionContentKind {
  const extension = getFileExtension(fileName);

  if (extension === ".md") {
    return "markdown";
  }

  if (extension === ".txt") {
    return "plain-text";
  }

  if (fileType === "text/markdown") {
    return "markdown";
  }

  if (fileType?.startsWith("text/")) {
    return "plain-text";
  }

  return "unknown";
}

function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}

function looksBinary(text: string): boolean {
  if (text.includes("\0")) {
    return true;
  }

  const suspiciousCharacters = Array.from(text).filter((character) => {
    const code = character.charCodeAt(0);
    return character === "\uFFFD" || (code < 32 && character !== "\n" && character !== "\r" && character !== "\t");
  }).length;

  return text.length > 0 && suspiciousCharacters / text.length > 0.02;
}

function buildWarnings(byteLength: number, providedSizeBytes: number | undefined, characterLength: number): KnowledgeExtractionWarning[] {
  const warnings: KnowledgeExtractionWarning[] = [
    {
      code: "NOT_INDEXED",
      message: "Extracted text is not indexed or saved in this step."
    },
    {
      code: "NOT_ANALYZED",
      message: "Extracted text is not used by Story analysis or AI briefing yet."
    }
  ];

  if (characterLength > KNOWLEDGE_EXTRACTION_POLICY.textPreviewMaxCharacters) {
    warnings.unshift({
      code: "PREVIEW_TRUNCATED",
      message: `Preview is capped at ${KNOWLEDGE_EXTRACTION_POLICY.textPreviewMaxCharacters} characters.`
    });
  }

  if (providedSizeBytes !== undefined && Math.abs(providedSizeBytes - byteLength) > 16) {
    warnings.push({
      code: "SIZE_MISMATCH",
      message: "Provided file size differs from extracted text byte length."
    });
  }

  return warnings;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

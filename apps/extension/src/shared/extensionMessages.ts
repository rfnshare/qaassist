import type { AzureDevOpsPageContext } from "../adapters/azureDevOpsPageAdapter";

export const EXTENSION_MESSAGES = {
  PING_CONTENT_SCRIPT: "qa-assist:ping-content-script",
  REQUEST_PAGE_CONTEXT: "qa-assist:request-page-context",
  PAGE_CONTEXT_DETECTED: "qa-assist:page-context-detected"
} as const;

export type ExtensionMessageType =
  (typeof EXTENSION_MESSAGES)[keyof typeof EXTENSION_MESSAGES];

export type RequestPageContextMessage = {
  type: typeof EXTENSION_MESSAGES.REQUEST_PAGE_CONTEXT;
};

export type PageContextDetectedMessage = {
  type: typeof EXTENSION_MESSAGES.PAGE_CONTEXT_DETECTED;
  payload: AzureDevOpsPageContext | null;
};

export type PingContentScriptMessage = {
  type: typeof EXTENSION_MESSAGES.PING_CONTENT_SCRIPT;
};

export type ExtensionMessage =
  | PingContentScriptMessage
  | RequestPageContextMessage
  | PageContextDetectedMessage;

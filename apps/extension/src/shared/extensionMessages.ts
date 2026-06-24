export const EXTENSION_MESSAGES = {
  PING_CONTENT_SCRIPT: "qa-assist:ping-content-script"
} as const;

export type ExtensionMessageType =
  (typeof EXTENSION_MESSAGES)[keyof typeof EXTENSION_MESSAGES];

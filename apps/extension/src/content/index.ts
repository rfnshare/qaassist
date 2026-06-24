import { EXTENSION_MESSAGES } from "../shared/extensionMessages";

// Placeholder for future Azure DevOps page detection.
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === EXTENSION_MESSAGES.PING_CONTENT_SCRIPT) {
    return true;
  }

  return false;
});

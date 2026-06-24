import { parseAzureDevOpsWorkItemUrl } from "../adapters/azureDevOpsPageAdapter";

const CONTENT_MESSAGES = {
  PING_CONTENT_SCRIPT: "qa-assist:ping-content-script",
  REQUEST_PAGE_CONTEXT: "qa-assist:request-page-context",
  PAGE_CONTEXT_DETECTED: "qa-assist:page-context-detected"
} as const;

type ContentMessage = {
  type: (typeof CONTENT_MESSAGES)[keyof typeof CONTENT_MESSAGES];
};

function detectAndNotify(): void {
  chrome.runtime.sendMessage({
    type: CONTENT_MESSAGES.PAGE_CONTEXT_DETECTED,
    payload: parseAzureDevOpsWorkItemUrl(window.location.href)
  });
}

chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
  if (message?.type === CONTENT_MESSAGES.PING_CONTENT_SCRIPT) {
    return true;
  }

  if (message?.type === CONTENT_MESSAGES.REQUEST_PAGE_CONTEXT) {
    sendResponse(parseAzureDevOpsWorkItemUrl(window.location.href));
    return false;
  }

  return false;
});

detectAndNotify();

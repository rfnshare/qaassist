import { useEffect, useState } from "react";
import type { AzureDevOpsPageContext } from "../adapters/azureDevOpsPageAdapter";
import { EXTENSION_MESSAGES, type ExtensionMessage } from "../shared/extensionMessages";
import { Header } from "./components/Header";
import { Navigation, type PanelKey } from "./components/Navigation";
import { PlaceholderPanel } from "./components/PlaceholderPanel";
import { StoryPanel } from "./components/StoryPanel";
import { StatusCard } from "./components/StatusCard";

type PlaceholderPanelKey = Exclude<PanelKey, "story">;

const panels: Record<PlaceholderPanelKey, { title: string; description: string; items: string[] }> = {
  setup: {
    title: "Setup placeholder",
    description: "Connection and workspace setup will appear here in a later step.",
    items: [
      "Azure DevOps connection is not implemented yet.",
      "LLM provider connection is not implemented yet.",
      "No credentials or tokens are stored in this shell."
    ]
  },
  analysis: {
    title: "Analysis placeholder",
    description: "Structured QA analysis will appear here after the backend and QA engine are implemented.",
    items: [
      "No fake analysis output is shown.",
      "No backend or LLM calls are made.",
      "Future sections include questions, scope, test cases, regression, automation, and UAT notes."
    ]
  },
  settings: {
    title: "Settings placeholder",
    description: "Preferences and local extension settings will appear here later.",
    items: [
      "No authentication settings are active yet.",
      "No organization, project, board, or sprint is selected.",
      "Storage permission is reserved for future explicit settings."
    ]
  }
};

export function App() {
  const [activePanel, setActivePanel] = useState<PanelKey>("setup");
  const [pageContext, setPageContext] = useState<AzureDevOpsPageContext | null>(null);
  const [storyStatus, setStoryStatus] = useState<"checking" | "detected" | "unsupported">("checking");

  useEffect(() => {
    function handleMessage(message: ExtensionMessage): void {
      if (message.type === EXTENSION_MESSAGES.PAGE_CONTEXT_DETECTED) {
        setPageContext(message.payload);
        setStoryStatus(message.payload ? "detected" : "unsupported");
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage);

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) {
        setStoryStatus("unsupported");
        return;
      }

      chrome.tabs.sendMessage(
        tab.id,
        { type: EXTENSION_MESSAGES.REQUEST_PAGE_CONTEXT },
        (response: AzureDevOpsPageContext | null | undefined) => {
          if (chrome.runtime.lastError) {
            setStoryStatus("unsupported");
            return;
          }

          setPageContext(response ?? null);
          setStoryStatus(response ? "detected" : "unsupported");
        }
      );
    });

    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  return (
    <main className="app-shell">
      <Header />
      <StatusCard />
      <Navigation activePanel={activePanel} onChange={setActivePanel} />
      {activePanel === "story" ? (
        <StoryPanel pageContext={pageContext} status={storyStatus} />
      ) : (
        <PlaceholderPanel {...panels[activePanel as PlaceholderPanelKey]} />
      )}
    </main>
  );
}

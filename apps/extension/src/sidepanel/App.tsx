import { useState } from "react";
import { Header } from "./components/Header";
import { Navigation, type PanelKey } from "./components/Navigation";
import { PlaceholderPanel } from "./components/PlaceholderPanel";
import { StatusCard } from "./components/StatusCard";

const panels: Record<PanelKey, { title: string; description: string; items: string[] }> = {
  setup: {
    title: "Setup placeholder",
    description: "Connection and workspace setup will appear here in a later step.",
    items: [
      "Azure DevOps connection is not implemented yet.",
      "LLM provider connection is not implemented yet.",
      "No credentials or tokens are stored in this shell."
    ]
  },
  story: {
    title: "Story placeholder",
    description: "Detected work item context will appear here after Azure DevOps detection is added.",
    items: [
      "No Azure DevOps page detection in this step.",
      "No work item data is read yet.",
      "This view is reserved for feature/story context."
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

  return (
    <main className="app-shell">
      <Header />
      <StatusCard />
      <Navigation activePanel={activePanel} onChange={setActivePanel} />
      <PlaceholderPanel {...panels[activePanel]} />
    </main>
  );
}

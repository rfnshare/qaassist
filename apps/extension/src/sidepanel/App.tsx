import { useEffect, useState } from "react";
import type { AzureDevOpsPageContext } from "../adapters/azureDevOpsPageAdapter";
import { EXTENSION_MESSAGES, type ExtensionMessage } from "../shared/extensionMessages";
import { Header } from "./components/Header";
import { Navigation, type PanelKey } from "./components/Navigation";

type DetectionStatus = "checking" | "detected" | "unsupported";

const previewWorkSignals = [
  ["Board condition", "Placeholder - Azure DevOps fetch not implemented yet"],
  ["My QA work", "Placeholder - assigned work ranking later"],
  ["Resolved bugs ready to retest", "Placeholder - state mapping required"],
  ["Suggested next work", "Preview only - not connected"]
];

export function App() {
  const [activePanel, setActivePanel] = useState<PanelKey>("command");
  const [pageContext, setPageContext] = useState<AzureDevOpsPageContext | null>(null);
  const [storyStatus, setStoryStatus] = useState<DetectionStatus>("checking");

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
      <section className="notice-card">
        <span className="pill amber">Preview only - not connected</span>
        <p>
          QA Assist is showing workflow placeholders. It detects Azure DevOps work item URLs only;
          no board data, story text, LLM call, write-back, or Azure Test Plans action is active.
        </p>
      </section>
      <Navigation activePanel={activePanel} onChange={setActivePanel} />
      {renderPanel(activePanel, pageContext, storyStatus)}
    </main>
  );
}

function renderPanel(
  activePanel: PanelKey,
  pageContext: AzureDevOpsPageContext | null,
  storyStatus: DetectionStatus
) {
  switch (activePanel) {
    case "command":
      return <CommandCenter />;
    case "queue":
      return <WorkQueue />;
    case "story":
      return <StoryWorkspace pageContext={pageContext} status={storyStatus} />;
    case "scope":
      return <ScopeAndCases />;
    case "manual":
      return <ManualRun />;
    case "automation":
      return <Automation />;
    case "mail":
      return <MailPanel />;
    case "settings":
      return <SettingsPanel />;
  }
}

function CommandCenter() {
  return (
    <section className="panel cockpit-panel">
      <PanelHeading label="Command Center" title="Board/work condition cockpit" />
      <div className="status-grid">
        {previewWorkSignals.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <WorkflowCard
        title="Connection/setup status"
        badge="Placeholder"
        items={[
          "Azure DevOps connection not implemented yet.",
          "Azure Test Plans destination not configured yet.",
          "LLM gateway not connected yet."
        ]}
      />
      <WorkflowCard
        title="Work recommendation"
        badge="Preview only"
        items={[
          "Future ranking: priority, severity, story points, age, assignment, release risk.",
          "No real board counts are shown in this shell.",
          "User chooses final work item."
        ]}
      />
    </section>
  );
}

function WorkQueue() {
  return (
    <section className="panel cockpit-panel">
      <PanelHeading label="Work Queue" title="Choose the next QA item" />
      <WorkflowCard
        title="Assigned stories"
        badge="Placeholder"
        items={["Assigned-to is a signal, not the only truth.", "Future Azure settings identify current QA user."]}
      />
      <WorkflowCard
        title="Bugs ready to test"
        badge="Placeholder"
        items={["Resolved/Ready to Test states require user mapping.", "Blocked and UAT-ready states will stay explicit."]}
      />
      <WorkflowCard
        title="Prioritization explanation"
        badge="Needs data"
        items={["Future recommendation explains evidence and assumptions.", "No silent reordering or hidden scoring."]}
      />
    </section>
  );
}

function StoryWorkspace({ pageContext, status }: { pageContext: AzureDevOpsPageContext | null; status: DetectionStatus }) {
  return (
    <section className="panel cockpit-panel">
      <PanelHeading label="Story Workspace" title="Clarify requirements before scope" />
      <ContextCard pageContext={pageContext} status={status} />
      <WorkflowCard
        title="Requirement sufficiency"
        badge="Needs confirmation"
        items={[
          "Future assistant identifies missing acceptance criteria and business rules.",
          "Open questions stay open until the QA user confirms answers.",
          "No fake story title or description is displayed."
        ]}
      />
      <WorkflowCard
        title="Discussion loop"
        badge="Human approved"
        items={["Ask BA/Product, Developer, UX, QA, or Support.", "Answers become user-confirmed only after approval."]}
      />
      <WorkflowCard
        title="Source/context"
        badge="Placeholder"
        items={["Board files and requirement memory will be scoped to the selected board.", "Sources must be labeled later."]}
      />
    </section>
  );
}

function ScopeAndCases() {
  return (
    <section className="panel cockpit-panel">
      <PanelHeading label="Scope & Cases" title="Build approved QA source of truth" />
      <WorkflowCard
        title="Scope builder"
        badge="Draft only"
        items={["In-scope, out-of-scope, assumptions, risks.", "Requires QA approval before test cases are final."]}
      />
      <WorkflowCard
        title="Generated test cases"
        badge="Requires QA approval"
        items={["Source references, priority, risk, preconditions, data, steps, expected result.", "Azure Test Plans is first destination after Azure setup."]}
      />
    </section>
  );
}

function ManualRun() {
  return (
    <section className="panel cockpit-panel">
      <PanelHeading label="Manual Run" title="Guided manual execution companion" />
      <WorkflowCard
        title="Guided execution"
        badge="Later"
        items={["Step-by-step test assistance.", "Notes, screenshots, and evidence placeholders."]}
      />
      <WorkflowCard
        title="Defect and handoff"
        badge="Approval required"
        items={["Create bug from current context after review.", "Retest resolved bugs and prepare UAT handoff."]}
      />
    </section>
  );
}

function Automation() {
  return (
    <section className="panel cockpit-panel">
      <PanelHeading label="Automation" title="Future Playwright copilot" />
      <WorkflowCard
        title="Automation candidates"
        badge="Later"
        items={["Playwright first for UI automation.", "API automation later.", "Generate only from approved source-of-truth test cases."]}
      />
      <WorkflowCard
        title="Repository modes"
        badge="Not connected"
        items={["Local repository.", "GitHub.", "Azure Repos.", "QA Assist-managed workspace.", "Manual export fallback."]}
      />
      <WorkflowCard
        title="Generate/run/maintain"
        badge="Approval required"
        items={["No code changes, PRs, or CI actions without user approval.", "CI/CD integration is not active yet."]}
      />
    </section>
  );
}

function MailPanel() {
  return (
    <section className="panel cockpit-panel">
      <PanelHeading label="Mail" title="Future update summary" />
      <WorkflowCard
        title="Mail/update summary"
        badge="Placeholder"
        items={["Email integration is not implemented.", "Future summary may surface release notes, mentions, or assignment changes."]}
      />
    </section>
  );
}

function SettingsPanel() {
  return (
    <section className="panel cockpit-panel">
      <PanelHeading label="Settings" title="Azure, board, privacy, and destinations" />
      <WorkflowCard
        title="Azure DevOps setup"
        badge="Placeholder"
        items={["Organization/project/board selection.", "State mapping: In QA, Ready to Test, Resolved, Blocked, Ready for UAT.", "Current QA user / assigned-to override."]}
      />
      <WorkflowCard
        title="Destinations and knowledge"
        badge="Placeholder"
        items={["Azure Test Plans first.", "Board-wise files and requirement memory.", "Privacy/evidence mode and LLM connection."]}
      />
    </section>
  );
}

function ContextCard({ pageContext, status }: { pageContext: AzureDevOpsPageContext | null; status: DetectionStatus }) {
  if (status === "checking") {
    return <WorkflowCard title="Current page" badge="Checking" items={["Looking for an Azure DevOps work item URL."]} />;
  }

  if (!pageContext) {
    return (
      <WorkflowCard
        title="Current page"
        badge="Unsupported"
        items={["Open an Azure DevOps work item page to detect story context."]}
      />
    );
  }

  return (
    <article className="context-card">
      <div className="card-head">
        <h3>Azure DevOps work item detected</h3>
        <span className="pill green">URL-only</span>
      </div>
      <dl className="context-list">
        <div>
          <dt>Organization</dt>
          <dd>{pageContext.organization}</dd>
        </div>
        <div>
          <dt>Project</dt>
          <dd>{pageContext.project}</dd>
        </div>
        <div>
          <dt>Work item ID</dt>
          <dd>{pageContext.workItemId}</dd>
        </div>
        <div>
          <dt>URL</dt>
          <dd className="breakable">{pageContext.workItemUrl}</dd>
        </div>
        <div>
          <dt>Detected at</dt>
          <dd>{pageContext.detectedAt}</dd>
        </div>
      </dl>
    </article>
  );
}

function PanelHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="panel-heading">
      <p className="section-label">{label}</p>
      <h2>{title}</h2>
    </div>
  );
}

function WorkflowCard({ title, badge, items }: { title: string; badge: string; items: string[] }) {
  return (
    <article className="workflow-card">
      <div className="card-head">
        <h3>{title}</h3>
        <span className="pill">{badge}</span>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

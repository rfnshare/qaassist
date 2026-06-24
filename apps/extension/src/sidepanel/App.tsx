import { useEffect, useState } from "react";
import type { AzureDevOpsPageContext } from "../adapters/azureDevOpsPageAdapter";
import { EXTENSION_MESSAGES, type ExtensionMessage } from "../shared/extensionMessages";
import { Header } from "./components/Header";
import { Navigation, type PanelKey } from "./components/Navigation";

type DetectionStatus = "checking" | "detected" | "unsupported";
type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "qaAssistTheme";

export function App() {
  const [activePanel, setActivePanel] = useState<PanelKey>("today");
  const [pageContext, setPageContext] = useState<AzureDevOpsPageContext | null>(null);
  const [storyStatus, setStoryStatus] = useState<DetectionStatus>("checking");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  useEffect(() => {
    chrome.storage.local.get({ [THEME_STORAGE_KEY]: "system" }, (items) => {
      setThemePreference(items[THEME_STORAGE_KEY] as ThemePreference);
    });
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(): void {
      const nextTheme = themePreference === "system" ? getSystemTheme() : themePreference;
      setResolvedTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
    }

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [themePreference]);

  useEffect(() => {
    chrome.storage.local.set({ [THEME_STORAGE_KEY]: themePreference });
  }, [themePreference]);

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
      <Header resolvedTheme={resolvedTheme} />
      <Navigation activePanel={activePanel} onChange={setActivePanel} />
      <div className="panel-frame">{renderPanel(activePanel, pageContext, storyStatus, themePreference, setThemePreference)}</div>
    </main>
  );
}

function renderPanel(
  activePanel: PanelKey,
  pageContext: AzureDevOpsPageContext | null,
  storyStatus: DetectionStatus,
  themePreference: ThemePreference,
  setThemePreference: (theme: ThemePreference) => void
) {
  switch (activePanel) {
    case "today":
      return <TodayPanel />;
    case "story":
      return <StoryPanel pageContext={pageContext} status={storyStatus} />;
    case "run":
      return <RunPanel />;
    case "settings":
      return <SettingsPanel themePreference={themePreference} onThemeChange={setThemePreference} />;
  }
}

function TodayPanel() {
  return (
    <section className="panel-content">
      <PanelIntro eyebrow="Today" title="Start with one calm QA decision." />
      <PrimaryAction label="Connect Azure Board later" helper="Preview only - not connected" />
      <InfoGrid
        items={[
          ["Board summary", "Board summary will appear here after Azure connection."],
          ["My QA work", "Assigned stories and bugs will appear here."],
          ["Ready to retest", "Resolved bugs ready to retest will appear here."],
          ["Updates", "Mail and board updates are a future summary."]
        ]}
      />
      <TrustNote text="No real board counts are shown. QA Assist is not fetching Azure DevOps data yet." />
    </section>
  );
}

function StoryPanel({ pageContext, status }: { pageContext: AzureDevOpsPageContext | null; status: DetectionStatus }) {
  const detected = Boolean(pageContext);

  return (
    <section className="panel-content">
      <PanelIntro eyebrow="Story" title={detected ? "Review this Azure work item." : "Open a story to begin."} />
      <PrimaryAction
        label={detected ? "Start story review" : "Open Azure DevOps story"}
        helper={detected ? "Detection only - no story text fetched" : "Open an Azure DevOps work item to begin."}
      />
      <DetectionCard pageContext={pageContext} status={status} />
      <InfoGrid
        items={[
          ["Requirement clarity", "Requirement sufficiency will appear after work item fetch."],
          ["Assistant discussion", "Questions remain open until QA confirms answers."],
          ["Scope and cases", "Draft scope and test cases require QA approval."]
        ]}
      />
    </section>
  );
}

function RunPanel() {
  return (
    <section className="panel-content">
      <PanelIntro eyebrow="Run" title="Prepare a focused manual test run." />
      <PrimaryAction label="Prepare manual run" helper="Manual testing support is not active yet" />
      <InfoGrid
        items={[
          ["Guided execution", "Step-by-step assistance will use approved test cases."],
          ["Evidence", "Screenshots, notes, and evidence capture are future workflow."],
          ["Create bug", "Bug creation will require explicit review and approval."],
          ["Automation", "Playwright is later and starts from approved cases."]
        ]}
      />
      <TrustNote text="No automation, bug creation, or write-back is active in this shell." />
    </section>
  );
}

function SettingsPanel({
  themePreference,
  onThemeChange
}: {
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}) {
  return (
    <section className="panel-content">
      <PanelIntro eyebrow="Settings" title="Keep setup explicit." />
      <ThemeToggle value={themePreference} onChange={onThemeChange} />
      <InfoGrid
        items={[
          ["Azure DevOps", "Connection, project, board, and state mapping later."],
          ["Current QA user", "Microsoft identity later; configured QA user early."],
          ["Azure Test Plans", "First test management destination after Azure setup."],
          ["Board knowledge", "Files and notes will be scoped to a selected board."],
          ["LLM and privacy", "Backend-mediated, minimized, redacted, source-labeled later."]
        ]}
      />
    </section>
  );
}

function DetectionCard({ pageContext, status }: { pageContext: AzureDevOpsPageContext | null; status: DetectionStatus }) {
  if (status === "checking") {
    return <InfoCard title="Current page" body="Checking for an Azure DevOps work item URL." tone="neutral" />;
  }

  if (!pageContext) {
    return <InfoCard title="Current page" body="Open an Azure DevOps work item to begin." tone="warning" />;
  }

  return (
    <article className="context-card">
      <div className="card-row">
        <h3>Azure DevOps work item detected</h3>
        <span className="status-pill success">URL only</span>
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

function PanelIntro({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="panel-intro">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </header>
  );
}

function PrimaryAction({ label, helper }: { label: string; helper: string }) {
  return (
    <button className="primary-action" type="button" aria-label={label}>
      <strong>{label}</strong>
      <span>{helper}</span>
    </button>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="info-grid">
      {items.map(([title, body]) => (
        <InfoCard key={title} title={title} body={body} />
      ))}
    </div>
  );
}

function InfoCard({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "warning" }) {
  return (
    <article className={`info-card ${tone}`}>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function TrustNote({ text }: { text: string }) {
  return <p className="trust-note">{text}</p>;
}

function ThemeToggle({ value, onChange }: { value: ThemePreference; onChange: (theme: ThemePreference) => void }) {
  const options: ThemePreference[] = ["system", "light", "dark"];

  return (
    <section className="theme-card" aria-label="Theme preference">
      <div>
        <h3>Theme</h3>
        <p>Choose a calmer reading mode for the side panel.</p>
      </div>
      <div className="theme-options">
        {options.map((option) => (
          <button
            key={option}
            className={value === option ? "theme-option active" : "theme-option"}
            type="button"
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

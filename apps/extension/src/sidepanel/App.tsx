import { useEffect, useState } from "react";
import type {
  BoardScope,
  BoardSummary,
  CurrentQaUserSettings,
  QaWorkQueue,
  WorkRecommendation
} from "@qa-assist/shared";
import type { AzureDevOpsPageContext } from "../adapters/azureDevOpsPageAdapter";
import { EXTENSION_MESSAGES, type ExtensionMessage } from "../shared/extensionMessages";
import { Header } from "./components/Header";
import { Navigation, type PanelKey } from "./components/Navigation";

type DetectionStatus = "checking" | "detected" | "unsupported";
type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";
type FetchStatus = "idle" | "loading" | "success" | "error";

type ExtensionSettings = {
  apiBaseUrl: string;
  organization: string;
  project: string;
  team: string;
  iterationPath: string;
  currentQaUserDisplayName: string;
  currentQaUserEmail: string;
};

type BoardSummaryPreviewResponse = {
  boardSummary: BoardSummary;
  workQueue: QaWorkQueue;
  recommendation?: WorkRecommendation;
};

const THEME_STORAGE_KEY = "qaAssistTheme";
const SETTINGS_STORAGE_KEY = "qaAssistSettings";
const DEFAULT_API_BASE_URL = "http://127.0.0.1:4317";
const DEFAULT_SETTINGS: ExtensionSettings = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  organization: "",
  project: "",
  team: "",
  iterationPath: "",
  currentQaUserDisplayName: "",
  currentQaUserEmail: ""
};

export function App() {
  const [activePanel, setActivePanel] = useState<PanelKey>("today");
  const [pageContext, setPageContext] = useState<AzureDevOpsPageContext | null>(null);
  const [storyStatus, setStoryStatus] = useState<DetectionStatus>("checking");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [fetchMessage, setFetchMessage] = useState<string>("Board summary has not been fetched yet.");
  const [preview, setPreview] = useState<BoardSummaryPreviewResponse | null>(null);

  useEffect(() => {
    chrome.storage.local.get({ [THEME_STORAGE_KEY]: "system", [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS }, (items) => {
      setThemePreference(items[THEME_STORAGE_KEY] as ThemePreference);
      setSettings({ ...DEFAULT_SETTINGS, ...(items[SETTINGS_STORAGE_KEY] as Partial<ExtensionSettings>) });
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
    chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings });
  }, [settings]);

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

  async function fetchBoardSummary(): Promise<void> {
    if (!settings.organization.trim() || !settings.project.trim()) {
      setFetchStatus("error");
      setFetchMessage("Complete Azure organization and project in Settings before fetching board summary.");
      return;
    }

    setFetchStatus("loading");
    setFetchMessage("Fetching live Azure DevOps board summary...");

    try {
      const response = await fetch(`${settings.apiBaseUrl.replace(/\/$/, "")}/azure-devops/board-summary/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedBoard: buildBoardScope(settings),
          currentQaUser: buildCurrentQaUser(settings),
          maxItems: 100
        })
      });

      const payload = (await response.json()) as BoardSummaryPreviewResponse | { error?: { message?: string } };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error?.message : "Board summary fetch failed.");
      }

      setPreview(payload as BoardSummaryPreviewResponse);
      setFetchStatus("success");
      setFetchMessage("Fetched live Azure DevOps board summary.");
    } catch (error) {
      setFetchStatus("error");
      setFetchMessage(error instanceof Error ? error.message : "Board summary fetch failed.");
    }
  }

  return (
    <main className="app-shell">
      <Header resolvedTheme={resolvedTheme} />
      <Navigation activePanel={activePanel} onChange={setActivePanel} />
      <div className="panel-frame">
        {renderPanel({
          activePanel,
          pageContext,
          storyStatus,
          themePreference,
          setThemePreference,
          settings,
          setSettings,
          fetchStatus,
          fetchMessage,
          preview,
          onFetchBoardSummary: fetchBoardSummary
        })}
      </div>
    </main>
  );
}

function renderPanel(props: {
  activePanel: PanelKey;
  pageContext: AzureDevOpsPageContext | null;
  storyStatus: DetectionStatus;
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
  settings: ExtensionSettings;
  setSettings: (settings: ExtensionSettings) => void;
  fetchStatus: FetchStatus;
  fetchMessage: string;
  preview: BoardSummaryPreviewResponse | null;
  onFetchBoardSummary: () => void;
}) {
  switch (props.activePanel) {
    case "today":
      return (
        <TodayPanel
          settings={props.settings}
          fetchStatus={props.fetchStatus}
          fetchMessage={props.fetchMessage}
          preview={props.preview}
          onFetchBoardSummary={props.onFetchBoardSummary}
        />
      );
    case "story":
      return <StoryPanel pageContext={props.pageContext} status={props.storyStatus} />;
    case "run":
      return <RunPanel />;
    case "settings":
      return (
        <SettingsPanel
          themePreference={props.themePreference}
          onThemeChange={props.setThemePreference}
          settings={props.settings}
          onSettingsChange={props.setSettings}
        />
      );
  }
}

function TodayPanel({
  settings,
  fetchStatus,
  fetchMessage,
  preview,
  onFetchBoardSummary
}: {
  settings: ExtensionSettings;
  fetchStatus: FetchStatus;
  fetchMessage: string;
  preview: BoardSummaryPreviewResponse | null;
  onFetchBoardSummary: () => void;
}) {
  const settingsReady = Boolean(settings.organization.trim() && settings.project.trim() && settings.apiBaseUrl.trim());
  const metrics = preview?.boardSummary.metrics ?? [];

  return (
    <section className="panel-content">
      <PanelIntro eyebrow="Today" title="Start with the real board picture." />
      <PrimaryAction
        label={fetchStatus === "loading" ? "Fetching board summary..." : "Fetch board summary"}
        helper={settingsReady ? "Read-only Azure DevOps preview" : "Complete Settings first"}
        disabled={fetchStatus === "loading"}
        onClick={onFetchBoardSummary}
      />
      <InfoCard title="Fetch status" body={fetchMessage} tone={fetchStatus === "error" ? "warning" : "neutral"} />
      {preview ? (
        <>
          <InfoGrid items={metrics.map((metric) => [metric.label, formatMetric(metric.value, metric.sourceDescription)])} />
          <WorkItemsList title="My QA work" items={preview.boardSummary.myWork} />
          <WorkItemsList title="Resolved bugs ready to retest" items={preview.boardSummary.resolvedBugsReadyToRetest} />
          {preview.recommendation ? (
            <InfoCard
              title="Suggested next work"
              body={`${preview.recommendation.recommendedWorkItem?.workItemId ?? "No item"} - ${preview.recommendation.reason} User confirmation is required.`}
            />
          ) : null}
        </>
      ) : (
        <>
          <InfoGrid
            items={[
              ["Board summary", "Live Azure DevOps counts will appear here after fetch."],
              ["My QA work", "Configured QA user matching runs after fetch."],
              ["Ready to retest", "Resolved bugs ready to retest appear after fetch."],
              ["Suggested next work", "Recommendation stays explainable and user-confirmed."]
            ]}
          />
          <TrustNote text="No fake board counts are shown. PAT stays on the API server; the extension stores only non-secret settings." />
        </>
      )}
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
  onThemeChange,
  settings,
  onSettingsChange
}: {
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  settings: ExtensionSettings;
  onSettingsChange: (settings: ExtensionSettings) => void;
}) {
  function updateSetting(key: keyof ExtensionSettings, value: string): void {
    onSettingsChange({ ...settings, [key]: value });
  }

  return (
    <section className="panel-content">
      <PanelIntro eyebrow="Settings" title="Configure local read-only Azure access." />
      <ThemeToggle value={themePreference} onChange={onThemeChange} />
      <section className="settings-form" aria-label="Azure DevOps local settings">
        <TextInput label="API base URL" value={settings.apiBaseUrl} onChange={(value) => updateSetting("apiBaseUrl", value)} />
        <TextInput label="Azure organization" value={settings.organization} onChange={(value) => updateSetting("organization", value)} />
        <TextInput label="Azure project" value={settings.project} onChange={(value) => updateSetting("project", value)} />
        <TextInput label="Azure team optional" value={settings.team} onChange={(value) => updateSetting("team", value)} />
        <TextInput label="Iteration path optional" value={settings.iterationPath} onChange={(value) => updateSetting("iterationPath", value)} />
        <TextInput
          label="Current QA display name optional"
          value={settings.currentQaUserDisplayName}
          onChange={(value) => updateSetting("currentQaUserDisplayName", value)}
        />
        <TextInput
          label="Current QA email optional"
          value={settings.currentQaUserEmail}
          onChange={(value) => updateSetting("currentQaUserEmail", value)}
        />
      </section>
      <TrustNote text="Do not enter PATs here. Azure DevOps PAT belongs only in the API server local .env file." />
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

function PrimaryAction({
  label,
  helper,
  disabled,
  onClick
}: {
  label: string;
  helper: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className="primary-action" type="button" aria-label={label} disabled={disabled} onClick={onClick}>
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

function WorkItemsList({ title, items }: { title: string; items: BoardSummary["myWork"] }) {
  return (
    <article className="info-card">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ul className="work-list">
          {items.slice(0, 5).map((item) => (
            <li key={`${item.source}-${item.workItemId}`}>
              <span>#{item.workItemId}</span>
              <strong>{item.title}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>No matching real Azure DevOps work items returned.</p>
      )}
    </article>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
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

function buildBoardScope(settings: ExtensionSettings): BoardScope {
  return {
    source: "azure-devops",
    organization: settings.organization.trim(),
    project: settings.project.trim(),
    team: normalizeOptional(settings.team),
    iterationPath: normalizeOptional(settings.iterationPath)
  };
}

function buildCurrentQaUser(settings: ExtensionSettings): CurrentQaUserSettings | undefined {
  const displayName = settings.currentQaUserDisplayName.trim();
  const email = settings.currentQaUserEmail.trim();

  if (!displayName && !email) {
    return undefined;
  }

  return {
    displayName: displayName || email,
    email: email || undefined,
    source: "configured-user",
    isOverride: true
  };
}

function normalizeOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatMetric(value: string | number | undefined, sourceDescription: string | undefined): string {
  const metricValue = value === undefined ? "Not returned" : String(value);
  return sourceDescription ? `${metricValue}. ${sourceDescription}` : metricValue;
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

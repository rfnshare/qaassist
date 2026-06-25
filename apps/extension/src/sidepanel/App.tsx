import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type {
  AzureDevOpsConnectionInfo,
  AzureDevOpsConnectionMode,
  AzureDevOpsConnectionStatus,
  AzureDevOpsProjectOption,
  AzureDevOpsTeamOption,
  BoardBriefing,
  BoardScope,
  BoardSummary,
  CurrentQaUserSettings,
  WorkItemDetail,
  WorkRecommendation
} from "@qa-assist/shared";
import {
  type BoardSummaryPreviewResponse,
  connectAzureDevOps,
  fetchBoardSummaryPreview,
  fetchWorkItemDetail,
  generateBoardBriefing,
  listAzureTeams
} from "../api/qaAssistApiClient";
import type { AzureDevOpsPageContext } from "../adapters/azureDevOpsPageAdapter";
import { EXTENSION_MESSAGES, type ExtensionMessage } from "../shared/extensionMessages";
import { Header } from "./components/Header";
import { Navigation, type PanelKey } from "./components/Navigation";

type DetectionStatus = "checking" | "detected" | "unsupported";
type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";
type FetchStatus = "idle" | "loading" | "success" | "error";
type BriefingStatus = "idle" | "loading" | "success" | "error";
type StoryDetailStatus = "idle" | "loading" | "success" | "error";
type SetupStatus = "idle" | "connecting" | "loading-projects" | "loading-teams" | "success" | "error";

type ExtensionSettings = {
  apiBaseUrl: string;
  azureServerUrl: string;
  connectionMode: AzureDevOpsConnectionMode;
  connectionStatus: AzureDevOpsConnectionStatus;
  connectionInfo?: AzureDevOpsConnectionInfo;
  lastConnectedAt: string;
  organization: string;
  project: string;
  team: string;
  board: string;
  iterationPath: string;
  currentQaUserDisplayName: string;
  currentQaUserEmail: string;
};

const THEME_STORAGE_KEY = "qaAssistTheme";
const SETTINGS_STORAGE_KEY = "qaAssistSettings";
const DEFAULT_API_BASE_URL = "http://127.0.0.1:4317";
const DEFAULT_SETTINGS: ExtensionSettings = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  azureServerUrl: "",
  connectionMode: "azure-devops-services",
  connectionStatus: "not-connected",
  connectionInfo: undefined,
  lastConnectedAt: "",
  organization: "",
  project: "",
  team: "",
  board: "",
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
  const [fetchMessage, setFetchMessage] = useState<string>("Board condition has not been fetched yet.");
  const [preview, setPreview] = useState<BoardSummaryPreviewResponse | null>(null);
  const [briefingStatus, setBriefingStatus] = useState<BriefingStatus>("idle");
  const [briefingMessage, setBriefingMessage] = useState<string>("Fetch board condition first to generate an evidence-bound briefing.");
  const [briefing, setBriefing] = useState<BoardBriefing | null>(null);
  const [storyDetailStatus, setStoryDetailStatus] = useState<StoryDetailStatus>("idle");
  const [storyDetailMessage, setStoryDetailMessage] = useState<string>("Open an Azure DevOps work item and fetch details.");
  const [workItemDetail, setWorkItemDetail] = useState<WorkItemDetail | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>("idle");
  const [setupMessage, setSetupMessage] = useState<string>("Enter your Azure DevOps Services or TFS URL to begin.");
  const [projectOptions, setProjectOptions] = useState<AzureDevOpsProjectOption[]>([]);
  const [teamOptions, setTeamOptions] = useState<AzureDevOpsTeamOption[]>([]);

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
    if (!hasSelectedTeamBoard(settings)) {
      setFetchStatus("error");
      setFetchMessage("Connect Azure and select a team board before fetching board condition.");
      return;
    }

    setFetchStatus("loading");
    setFetchMessage("Fetching live Azure DevOps board condition...");

    try {
      const payload = await fetchBoardSummaryPreview(settings.apiBaseUrl, {
        selectedBoard: buildBoardScope(settings),
        currentQaUser: buildCurrentQaUser(settings),
        maxItems: 100
      });

      setPreview(payload);
      setBriefing(null);
      setBriefingStatus("idle");
      setBriefingMessage("Board condition fetched. Generate an evidence-bound QA briefing when ready.");
      setFetchStatus("success");
      setFetchMessage("Fetched live Azure DevOps board condition.");
    } catch (error) {
      setFetchStatus("error");
      setFetchMessage(error instanceof Error ? error.message : "Board condition fetch failed.");
    }
  }

  async function generateQaBriefing(): Promise<void> {
    if (!preview) {
      setBriefingStatus("error");
      setBriefingMessage("Fetch board condition first to generate an evidence-bound briefing.");
      return;
    }

    setBriefingStatus("loading");
    setBriefingMessage("Generating evidence-bound QA briefing...");

    try {
      const payload = await generateBoardBriefing(settings.apiBaseUrl, {
        boardSummary: preview.boardSummary,
        workQueue: preview.workQueue,
        recommendation: preview.recommendation,
        currentQaUser: buildCurrentQaUser(settings)
      });

      setBriefing(payload);
      setBriefingStatus("success");
      setBriefingMessage("Generated evidence-bound preview briefing.");
    } catch (error) {
      setBriefingStatus("error");
      setBriefingMessage(error instanceof Error ? error.message : "Briefing generation failed.");
    }
  }

  async function fetchStoryDetail(): Promise<void> {
    if (!pageContext) {
      setStoryDetailStatus("error");
      setStoryDetailMessage("Open an Azure DevOps work item to fetch story details.");
      return;
    }

    setStoryDetailStatus("loading");
    setStoryDetailMessage("Fetching read-only work item details...");

    try {
      const payload = await fetchWorkItemDetail(settings.apiBaseUrl, {
        organization: pageContext.organization,
        project: pageContext.project,
        workItemId: pageContext.workItemId,
        team: normalizeOptional(settings.team),
        url: pageContext.workItemUrl
      });

      setWorkItemDetail(payload.workItem);
      setStoryDetailStatus("success");
      setStoryDetailMessage("Fetched source-backed Azure work item details.");
    } catch (error) {
      setStoryDetailStatus("error");
      setStoryDetailMessage(error instanceof Error ? error.message : "Work item detail fetch failed.");
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
          briefing,
          briefingStatus,
          briefingMessage,
          setupStatus,
          setupMessage,
          setSetupStatus,
          setSetupMessage,
          projectOptions,
          setProjectOptions,
          teamOptions,
          setTeamOptions,
          onFetchBoardSummary: fetchBoardSummary,
          onGenerateQaBriefing: generateQaBriefing,
          storyDetailStatus,
          storyDetailMessage,
          workItemDetail,
          onFetchStoryDetail: fetchStoryDetail,
          onOpenSettings: () => setActivePanel("settings")
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
  briefing: BoardBriefing | null;
  briefingStatus: BriefingStatus;
  briefingMessage: string;
  setupStatus: SetupStatus;
  setupMessage: string;
  setSetupStatus: (status: SetupStatus) => void;
  setSetupMessage: (message: string) => void;
  projectOptions: AzureDevOpsProjectOption[];
  setProjectOptions: (projects: AzureDevOpsProjectOption[]) => void;
  teamOptions: AzureDevOpsTeamOption[];
  setTeamOptions: (teams: AzureDevOpsTeamOption[]) => void;
  onFetchBoardSummary: () => void;
  onGenerateQaBriefing: () => void;
  storyDetailStatus: StoryDetailStatus;
  storyDetailMessage: string;
  workItemDetail: WorkItemDetail | null;
  onFetchStoryDetail: () => void;
  onOpenSettings: () => void;
}) {
  switch (props.activePanel) {
    case "today":
      return (
        <TodayPanel
          settings={props.settings}
          fetchStatus={props.fetchStatus}
          fetchMessage={props.fetchMessage}
          preview={props.preview}
          briefing={props.briefing}
          briefingStatus={props.briefingStatus}
          briefingMessage={props.briefingMessage}
          onFetchBoardSummary={props.onFetchBoardSummary}
          onGenerateQaBriefing={props.onGenerateQaBriefing}
          onOpenSettings={props.onOpenSettings}
        />
      );
    case "story":
      return (
        <StoryPanel
          pageContext={props.pageContext}
          status={props.storyStatus}
          settings={props.settings}
          detail={props.workItemDetail}
          detailStatus={props.storyDetailStatus}
          detailMessage={props.storyDetailMessage}
          onFetchStoryDetail={props.onFetchStoryDetail}
        />
      );
    case "run":
      return <RunPanel />;
    case "settings":
      return (
        <SettingsPanel
          themePreference={props.themePreference}
          onThemeChange={props.setThemePreference}
          settings={props.settings}
          onSettingsChange={props.setSettings}
          setupStatus={props.setupStatus}
          setupMessage={props.setupMessage}
          onSetupStatusChange={props.setSetupStatus}
          onSetupMessageChange={props.setSetupMessage}
          projectOptions={props.projectOptions}
          onProjectOptionsChange={props.setProjectOptions}
          teamOptions={props.teamOptions}
          onTeamOptionsChange={props.setTeamOptions}
        />
      );
  }
}

function TodayPanel({
  settings,
  fetchStatus,
  fetchMessage,
  preview,
  briefing,
  briefingStatus,
  briefingMessage,
  onFetchBoardSummary,
  onGenerateQaBriefing,
  onOpenSettings
}: {
  settings: ExtensionSettings;
  fetchStatus: FetchStatus;
  fetchMessage: string;
  preview: BoardSummaryPreviewResponse | null;
  briefing: BoardBriefing | null;
  briefingStatus: BriefingStatus;
  briefingMessage: string;
  onFetchBoardSummary: () => void;
  onGenerateQaBriefing: () => void;
  onOpenSettings: () => void;
}) {
  const selectedTeamReady = hasSelectedTeamBoard(settings);
  const metrics = preview?.boardSummary.metrics ?? [];
  const stateBuckets = preview ? getStateBucketEntries(preview.boardSummary) : [];

  return (
    <section className="panel-content">
      <PanelIntro eyebrow="Today" title={selectedTeamReady ? "Start with this team's board condition." : "Set up the Azure board first."} />
      <SelectedTeamBanner settings={settings} />
      <PrimaryAction
        label={selectedTeamReady ? (fetchStatus === "loading" ? "Fetching board condition..." : "Fetch board condition") : "Set up Azure board"}
        helper={selectedTeamReady ? "Read-only Azure DevOps preview for the selected team" : "Connect Azure and select a team board to start."}
        disabled={fetchStatus === "loading"}
        onClick={selectedTeamReady ? onFetchBoardSummary : onOpenSettings}
      />
      <BriefingCard
        briefing={briefing}
        status={briefingStatus}
        message={briefingMessage}
        canGenerate={selectedTeamReady && Boolean(preview)}
        onGenerate={onGenerateQaBriefing}
      />
      {selectedTeamReady ? (
        <InfoCard title="Fetch status" body={fetchMessage} tone={fetchStatus === "error" ? "warning" : "neutral"} />
      ) : (
        <InfoCard title="Setup needed" body="Connect Azure and select a team board to start. QA Assist uses the selected team board for Today, Story, Run, and recommendations." tone="warning" />
      )}
      {preview ? (
        <>
          <SnapshotMeta summary={preview.boardSummary} />
          <InfoGrid items={metrics.map((metric) => [renameMetric(metric.label), formatMetric(metric.value, metric.sourceDescription)])} />
          <StateBucketGrid buckets={stateBuckets} />
          <WorkItemsList title="My assigned QA work" items={preview.boardSummary.myWork} />
          <WorkItemsList title="Ready to retest" items={preview.boardSummary.resolvedBugsReadyToRetest} />
          {preview.recommendation ? <RecommendationCard recommendation={preview.recommendation} /> : null}
        </>
      ) : (
        <InfoGrid
          items={[
            ["Board condition", selectedTeamReady ? "Live Azure DevOps board condition appears after fetch." : "Waiting for selected team board."],
            ["Ready to retest", "Resolved bugs ready for QA retest will appear after fetch."],
            ["My assigned QA work", "Configured QA user matching runs after fetch."],
            ["Suggested next work", "Recommendation stays explainable and needs confirmation."]
          ]}
        />
      )}
      <TrustNote text="No fake board data is shown. All write-back and LLM-assisted recommendations remain inactive until explicitly implemented and approved." />
    </section>
  );
}

function StoryPanel({
  pageContext,
  status,
  settings,
  detail,
  detailStatus,
  detailMessage,
  onFetchStoryDetail
}: {
  pageContext: AzureDevOpsPageContext | null;
  status: DetectionStatus;
  settings: ExtensionSettings;
  detail: WorkItemDetail | null;
  detailStatus: StoryDetailStatus;
  detailMessage: string;
  onFetchStoryDetail: () => void;
}) {
  const detected = Boolean(pageContext);
  const differsFromSelectedBoard =
    detected &&
    settings.project.trim() &&
    settings.project.trim().toLowerCase() !== pageContext?.project.toLowerCase();

  return (
    <section className="panel-content">
      <PanelIntro eyebrow="Story" title={detected ? "Review this Azure work item." : "Open a story to begin."} />
      <PrimaryAction
        label={detailStatus === "loading" ? "Fetching details..." : detected ? "Fetch story details" : "Open Azure DevOps story"}
        helper={detected ? "Read-only via QA Assist API" : "Open an Azure DevOps work item to begin."}
        disabled={!detected || detailStatus === "loading"}
        onClick={detected ? onFetchStoryDetail : undefined}
      />
      <DetectionCard pageContext={pageContext} status={status} />
      {detected && !hasSelectedTeamBoard(settings) ? (
        <InfoCard title="Page context" body="Using detected page context. Select a team board in Settings for Today/recommendations." />
      ) : null}
      {differsFromSelectedBoard ? (
        <InfoCard title="Board mismatch" body="This work item page differs from the selected team board. Review before using board-level recommendations." tone="warning" />
      ) : null}
      <InfoCard title="Fetch status" body={detailMessage} tone={detailStatus === "error" ? "warning" : "neutral"} />
      {detail ? <StoryDetailView detail={detail} /> : <StoryPlaceholderCards />}
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

function StoryDetailView({ detail }: { detail: WorkItemDetail }) {
  const relationBuckets = groupRelations(detail);

  return (
    <>
      <article className="snapshot-card">
        <div>
          <span className="meta-label">Fetched</span>
          <strong>{formatDateTime(detail.evidence.fetchedAt)}</strong>
        </div>
        <div>
          <span className="meta-label">Source</span>
          <strong>{detail.evidence.sourceDescription}</strong>
        </div>
      </article>
      <article className="story-title-card">
        <span className="status-pill success">Source-backed</span>
        <h3 title={detail.title}>{truncateTitle(detail.title, 96)}</h3>
        <p>#{detail.workItemId} | {detail.workItemType} | {detail.state ?? "State not returned"}</p>
      </article>
      <InfoGrid
        items={[
          ["Assigned to", detail.assignedTo ?? "Not returned"],
          ["Tags", detail.tags.length > 0 ? detail.tags.join(", ") : "None returned"],
          ["Priority", formatOptionalValue(detail.priority)],
          ["Severity", detail.severity ?? "Not returned"],
          ["Story points", formatOptionalValue(detail.storyPoints)],
          ["Changed", detail.changedDate ? formatDateTime(detail.changedDate) : "Not returned"],
          ["Area", detail.areaPath ?? "Not returned"],
          ["Iteration", detail.iterationPath ?? "Not returned"]
        ]}
      />
      <TextPreviewCard title="Description evidence" text={detail.descriptionText} />
      <TextPreviewCard title="Acceptance criteria evidence" text={detail.acceptanceCriteriaText} />
      <RelationSummary buckets={relationBuckets} />
      <StoryPlaceholderCards />
      <TrustNote text="Description and acceptance criteria are evidence, not final analysis. AI analysis and test case generation will be added later and must stay source-backed." />
    </>
  );
}

function TextPreviewCard({ title, text }: { title: string; text?: string }) {
  return (
    <article className="info-card text-preview-card">
      <h3>{title}</h3>
      <p>{text ? truncateLongText(text, 520) : "Not returned by Azure DevOps."}</p>
    </article>
  );
}

function RelationSummary({ buckets }: { buckets: Array<[string, number]> }) {
  return (
    <article className="info-card">
      <h3>Relations</h3>
      {buckets.length > 0 ? (
        <div className="relation-grid">
          {buckets.map(([label, count]) => (
            <span className="relation-pill" key={label}>
              {label}: {count}
            </span>
          ))}
        </div>
      ) : (
        <p>No parent, child, related, duplicate, or test-case relations returned.</p>
      )}
    </article>
  );
}

function StoryPlaceholderCards() {
  return (
    <InfoGrid
      items={[
        ["Requirement summary", "Not analyzed yet. Fetch details first; AI analysis comes later."],
        ["Gaps/questions", "Not analyzed yet. Open questions must stay open until QA confirms them."],
        ["Test scope draft", "Not generated yet. Final test scope and cases require user confirmation."]
      ]}
    />
  );
}

function SettingsPanel({
  themePreference,
  onThemeChange,
  settings,
  onSettingsChange,
  setupStatus,
  setupMessage,
  onSetupStatusChange,
  onSetupMessageChange,
  projectOptions,
  onProjectOptionsChange,
  teamOptions,
  onTeamOptionsChange
}: {
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  settings: ExtensionSettings;
  onSettingsChange: (settings: ExtensionSettings) => void;
  setupStatus: SetupStatus;
  setupMessage: string;
  onSetupStatusChange: (status: SetupStatus) => void;
  onSetupMessageChange: (message: string) => void;
  projectOptions: AzureDevOpsProjectOption[];
  onProjectOptionsChange: (projects: AzureDevOpsProjectOption[]) => void;
  teamOptions: AzureDevOpsTeamOption[];
  onTeamOptionsChange: (teams: AzureDevOpsTeamOption[]) => void;
}) {
  function updateSetting(key: keyof ExtensionSettings, value: string): void {
    onSettingsChange({ ...settings, [key]: value });
  }

  async function connectAzure(): Promise<void> {
    onSetupStatusChange("connecting");
    onSetupMessageChange("Checking the Azure connection through the QA Assist API...");
    onSettingsChange({ ...settings, connectionStatus: "connecting" });
    onProjectOptionsChange([]);
    onTeamOptionsChange([]);

    try {
      const result = await connectAzureDevOps(settings.apiBaseUrl, settings.azureServerUrl);
      const connection = result.connection;

      onSettingsChange({
        ...settings,
        connectionInfo: connection,
        connectionMode: connection.mode,
        connectionStatus: connection.status,
        lastConnectedAt: connection.connectedAt ?? new Date().toISOString(),
        organization: connection.organization ?? settings.organization,
        project: connection.project ?? "",
        team: "",
        board: "",
        iterationPath: ""
      });
      onProjectOptionsChange(result.projects);
      onSetupStatusChange("success");
      onSetupMessageChange(
        result.projects.length > 0
          ? `Connected. ${result.projects.length} project option${result.projects.length === 1 ? "" : "s"} discovered.`
          : "Connected. Project discovery returned no projects."
      );
    } catch (error) {
      onSettingsChange({ ...settings, connectionStatus: "needs-attention" });
      onSetupStatusChange("error");
      onSetupMessageChange(error instanceof Error ? error.message : "Azure connection failed.");
    }
  }

  async function selectProject(projectName: string): Promise<void> {
    onSettingsChange({ ...settings, project: projectName, team: "", board: "" });
    onTeamOptionsChange([]);

    if (!settings.connectionInfo || !projectName) {
      return;
    }

    onSetupStatusChange("loading-teams");
    onSetupMessageChange("Discovering team boards for the selected project...");

    try {
      const result = await listAzureTeams(settings.apiBaseUrl, settings.connectionInfo, projectName);
      onTeamOptionsChange(result.teams);
      onSetupStatusChange("success");
      onSetupMessageChange(
        result.teams.length > 0
          ? `${result.teams.length} team board option${result.teams.length === 1 ? "" : "s"} discovered.`
          : "No team boards were returned for this project."
      );
    } catch (error) {
      onSetupStatusChange("error");
      onSetupMessageChange(error instanceof Error ? error.message : "Team board discovery failed.");
    }
  }

  function selectTeam(teamName: string): void {
    onSettingsChange({ ...settings, team: teamName, board: teamName });
    onSetupStatusChange("success");
    onSetupMessageChange(teamName ? `Selected Team: ${settings.organization}/${settings.project}/${teamName}` : "Select a team board.");
  }

  function changeSelection(): void {
    onSettingsChange({ ...settings, project: "", team: "", board: "" });
    onTeamOptionsChange([]);
    onSetupMessageChange("Choose a project, then select the team board QA Assist should use.");
  }

  const selectedTeamReady = hasSelectedTeamBoard(settings);
  const canSelectProject = projectOptions.length > 0;
  const canSelectTeam = teamOptions.length > 0;

  return (
    <section className="panel-content">
      <PanelIntro eyebrow="Settings" title="Connect Azure, then configure QA Assist." />
      <ThemeToggle value={themePreference} onChange={onThemeChange} />
      <SettingsCard
        title="Connect Azure"
        status={<ConnectionPill status={settings.connectionStatus} />}
        body="Enter the Azure DevOps Services or Team Foundation Server URL your team uses. OAuth is planned later; this shell only validates the shape of the URL."
      >
        <TextInput
          label="Azure DevOps Services or TFS URL"
          placeholder="https://dev.azure.com/your-org"
          help="For TFS, use a URL like https://your-server/tfs/collection."
          value={settings.azureServerUrl}
          onChange={(value) => updateSetting("azureServerUrl", value)}
        />
        <SecondaryAction label={setupStatus === "connecting" ? "Connecting..." : "Connect"} disabled={setupStatus === "connecting"} onClick={connectAzure} />
        <InfoCard title="Connection status" body={setupMessage} tone={setupStatus === "error" ? "warning" : "neutral"} />
        <TrustNote text="For local development, the API server may use a backend-only PAT. QA users do not enter tokens here." />
      </SettingsCard>
      <SettingsCard
        title="Select Team Board"
        status={selectedTeamReady ? <span className="status-pill success">Selected</span> : <span className="status-pill">Needed</span>}
        body="Azure projects can have multiple team boards. QA Assist uses the selected team board for Today, Story, Run, and recommendations."
      >
        {canSelectProject ? (
          <SelectInput
            label="Project"
            value={settings.project}
            options={projectOptions.map((project) => ({ label: project.name, value: project.name }))}
            placeholder="Choose project"
            onChange={(value) => void selectProject(value)}
          />
        ) : (
          <InfoCard title="Projects" body="Connect with a backend token to discover projects. Manual fields remain available under Advanced local preview." />
        )}
        {canSelectTeam ? (
          <SelectInput
            label="Team board"
            value={settings.team}
            options={teamOptions.map((team) => ({ label: team.name, value: team.name }))}
            placeholder="Choose team board"
            onChange={selectTeam}
          />
        ) : (
          <InfoCard title="Team boards" body="Choose a discovered project to load team boards." />
        )}
        <SelectedTeamBanner settings={settings} />
        <SecondaryAction label="Change" onClick={changeSelection} />
        <details className="advanced-settings">
          <summary>Advanced local preview</summary>
          <div className="settings-form">
            <TextInput label="Organization" value={settings.organization} onChange={(value) => updateSetting("organization", value)} />
            <TextInput label="Project" value={settings.project} onChange={(value) => updateSetting("project", value)} />
            <TextInput label="Team" value={settings.team} onChange={(value) => updateSetting("team", value)} />
            <TextInput label="Board optional" value={settings.board} onChange={(value) => updateSetting("board", value)} />
            <TextInput label="Iteration path optional" value={settings.iterationPath} onChange={(value) => updateSetting("iterationPath", value)} />
          </div>
        </details>
      </SettingsCard>
      <SettingsCard title="QA Workflow" body="State mapping and QA identity remain user-controlled before recommendations are treated as useful.">
        <InfoGrid
          items={[
            ["State mapping", "Map In QA, Ready to Test, Resolved, Blocked, and Ready for UAT after Azure state discovery is added."],
            ["Current QA user", "Set display name or email for assigned-to matching."],
            ["Assigned-to matching", "Assignment is one signal, not the final truth."]
          ]}
        />
        <div className="settings-form">
          <TextInput label="Current QA display name optional" value={settings.currentQaUserDisplayName} onChange={(value) => updateSetting("currentQaUserDisplayName", value)} />
          <TextInput label="Current QA email optional" value={settings.currentQaUserEmail} onChange={(value) => updateSetting("currentQaUserEmail", value)} />
        </div>
      </SettingsCard>
      <SettingsCard title="Test Management" body="Azure Test Plans is first, but no test case write-back is active yet.">
        <InfoGrid
          items={[
            ["Destination", "Test plan and suite selection placeholder."],
            ["Story links", "Approved test cases can later link back to the story."],
            ["Approval", "Creating or updating test cases will require explicit user approval."]
          ]}
        />
      </SettingsCard>
      <SettingsCard title="Board Knowledge" body="Board-wise knowledge is future scoped context, not active upload/storage.">
        <InfoGrid
          items={[
            ["Requirement upload", "Placeholder for PRDs and requirement files scoped to the selected team board."],
            ["Meeting transcript", "Placeholder for transcript context after explicit upload."],
            ["BA Q&A and product rules", "Placeholder for confirmed answers and rules."]
          ]}
        />
      </SettingsCard>
      <SettingsCard title="AI Analysis" body="AI support will be backend-mediated and evidence-bound. No LLM calls are active yet.">
        <InfoGrid
          items={[
            ["AI board briefing", "Will explain what changed, what needs QA attention, and why."],
            ["Story requirement analysis", "Will label source-backed, assumption, and needs confirmation output."],
            ["Guardrails", "Unverified output must never be treated as fact."]
          ]}
        />
      </SettingsCard>
      <SettingsCard title="Automation" body="Automation setup is a later capability after approved test cases.">
        <InfoGrid
          items={[
            ["Repo options", "Local repo, GitHub, Azure Repos, QA Assist-managed workspace, or manual export."],
            ["Playwright first later", "No automation generation or execution is active now."]
          ]}
        />
      </SettingsCard>
      <SettingsCard title="Privacy & Approval" body="QA Assist stays read-only until a user explicitly approves external actions.">
        <InfoGrid
          items={[
            ["No silent write-back", "Azure Test Plans, bugs, comments, files, and repos require approval."],
            ["Evidence-bound output", "Source-backed, user-confirmed, assumption, and needs confirmation labels stay central."],
            ["AI privacy", "Future AI calls should minimize and redact context before backend-mediated analysis."]
          ]}
        />
        <details className="advanced-settings">
          <summary>Advanced local development</summary>
          <TextInput
            label="API base URL"
            help="Local backend for read-only preview, usually http://127.0.0.1:4317. PATs stay backend-only."
            value={settings.apiBaseUrl}
            onChange={(value) => updateSetting("apiBaseUrl", value)}
          />
        </details>
      </SettingsCard>
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

function SecondaryAction({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button className="secondary-action" type="button" disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}

function SettingsCard({
  title,
  body,
  status,
  children
}: {
  title: string;
  body: string;
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="settings-card">
      <div className="card-row">
        <div>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
        {status}
      </div>
      <div className="settings-card-body">{children}</div>
    </section>
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
              <span>#{item.workItemId} - {item.state}</span>
              <strong title={item.title}>{truncateTitle(item.title)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>No matching real Azure DevOps work items returned.</p>
      )}
    </article>
  );
}

function SnapshotMeta({ summary }: { summary: BoardSummary }) {
  return (
    <article className="snapshot-card">
      <div>
        <span className="meta-label">Selected Team</span>
        <strong>{formatBoardLabel(summary.selectedBoard)}</strong>
      </div>
      <div>
        <span className="meta-label">Fetched</span>
        <strong>{formatDateTime(summary.generatedAt)}</strong>
      </div>
      <p>{summary.dataFreshness ?? summary.sourceDescription ?? "Live Azure DevOps preview data."}</p>
    </article>
  );
}

function StateBucketGrid({ buckets }: { buckets: Array<[string, number | undefined]> }) {
  return (
    <section className="state-grid" aria-label="State buckets">
      {buckets.map(([label, count]) => (
        <article className="state-bucket" key={label}>
          <span>{label}</span>
          <strong>{count ?? "Not returned"}</strong>
        </article>
      ))}
    </section>
  );
}

function RecommendationCard({ recommendation }: { recommendation: WorkRecommendation }) {
  const item = recommendation.recommendedWorkItem;

  return (
    <article className="info-card recommendation-card">
      <div className="card-row">
        <h3>Suggested next work</h3>
        <span className="status-pill">Needs confirmation</span>
      </div>
      <p>{item ? `#${item.workItemId} - ${truncateTitle(item.title)}` : "No recommended item returned."}</p>
      <p>{recommendation.reason}</p>
    </article>
  );
}

function BriefingCard({
  briefing,
  status,
  message,
  canGenerate,
  onGenerate
}: {
  briefing: BoardBriefing | null;
  status: BriefingStatus;
  message: string;
  canGenerate: boolean;
  onGenerate: () => void;
}) {
  return (
    <article className="info-card briefing-card">
      <div className="card-row">
        <h3>AI board briefing</h3>
        <span className="status-pill">{briefing?.mode === "deterministic-preview" ? "Evidence-bound preview" : "Needs confirmation"}</span>
      </div>
      <p>{message}</p>
      <SecondaryAction
        label={status === "loading" ? "Generating briefing..." : "Generate QA briefing"}
        disabled={!canGenerate || status === "loading"}
        onClick={onGenerate}
      />
      {briefing ? (
        <div className="briefing-body">
          <strong>{briefing.headline}</strong>
          <p>{briefing.summary}</p>
          <BriefingList title="Ready to retest" items={briefing.readyToRetest.insights.map((insight) => insight.text)} />
          <BriefingList title="My QA work" items={briefing.myQaWork.insights.map((insight) => insight.text)} />
          {briefing.suggestedNextWork ? (
            <BriefingList title="Suggested next work" items={[`${briefing.suggestedNextWork.label}. ${briefing.suggestedNextWork.reason}`]} />
          ) : null}
          <BriefingList title="Risks and gaps" items={briefing.risksAndGaps.map((risk) => risk.text)} />
          <BriefingList title="Assumptions" items={briefing.assumptions.slice(0, 3)} />
          <BriefingList title="Needs confirmation" items={briefing.needsConfirmation.slice(0, 3)} />
          <p className="trust-note">{briefing.disclaimer}</p>
        </div>
      ) : null}
    </article>
  );
}

function BriefingList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="briefing-list">
      <span>{title}</span>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TextInput({
  label,
  help,
  placeholder,
  value,
  onChange
}: {
  label: string;
  help?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      {help ? <small>{help}</small> : null}
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

function ConnectionPill({ status }: { status: AzureDevOpsConnectionStatus }) {
  if (status === "connecting") {
    return <span className="status-pill">Connecting</span>;
  }

  if (status === "connected") {
    return <span className="status-pill success">Connected</span>;
  }

  if (status === "needs-attention") {
    return <span className="status-pill warning">Needs attention</span>;
  }

  return <span className="status-pill">Not connected</span>;
}

function SelectedTeamBanner({ settings }: { settings: ExtensionSettings }) {
  if (!hasSelectedTeamBoard(settings)) {
    return <InfoCard title="Selected Team" body="No team board selected yet." tone="warning" />;
  }

  return <InfoCard title="Selected Team" body={formatSettingsBoardLabel(settings)} />;
}

function buildBoardScope(settings: ExtensionSettings): BoardScope {
  return {
    source: "azure-devops",
    serverUrl: normalizeOptional(settings.azureServerUrl),
    connectionMode: settings.connectionMode,
    connectionStatus: settings.connectionStatus,
    lastConnectedAt: normalizeOptional(settings.lastConnectedAt),
    displayLabel: formatSettingsBoardLabel(settings),
    organization: settings.organization.trim(),
    project: settings.project.trim(),
    team: normalizeOptional(settings.team),
    board: normalizeOptional(settings.board),
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

function hasSelectedTeamBoard(settings: ExtensionSettings): boolean {
  return Boolean(settings.organization.trim() && settings.project.trim() && settings.team.trim());
}

function formatSettingsBoardLabel(settings: ExtensionSettings): string {
  return `${settings.organization.trim()}/${settings.project.trim()}/${settings.team.trim()}`;
}

function formatBoardLabel(board: BoardScope): string {
  return board.displayLabel ?? `${board.organization}/${board.project}/${board.team ?? "Team not selected"}`;
}

function normalizeOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatMetric(value: string | number | undefined, sourceDescription: string | undefined): string {
  const metricValue = value === undefined ? "Not returned" : String(value);
  return sourceDescription ? `${metricValue}. ${sourceDescription}` : metricValue;
}

function renameMetric(label: string): string {
  if (label === "Candidate work items") return "Board condition";
  if (label === "My QA work") return "My assigned QA work";
  if (label === "Resolved bugs ready to retest") return "Ready to retest";
  return label;
}

function getStateBucketEntries(summary: BoardSummary): Array<[string, number | undefined]> {
  return [
    ["In QA", summary.stateBuckets.inQA.count],
    ["Ready to Test", summary.stateBuckets.readyToTest.count],
    ["Resolved", summary.stateBuckets.resolved.count],
    ["Blocked", summary.stateBuckets.blocked.count],
    ["Ready for UAT", summary.stateBuckets.readyForUat.count]
  ];
}

function truncateTitle(title: string, maxLength = 72): string {
  const normalized = title.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

function truncateLongText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

function formatOptionalValue(value: string | number | undefined): string {
  return value === undefined ? "Not returned" : String(value);
}

function groupRelations(detail: WorkItemDetail): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const relation of detail.relations) {
    const label = relation.kind;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([label, count]) => [formatRelationKind(label), count]);
}

function formatRelationKind(kind: string): string {
  return kind
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

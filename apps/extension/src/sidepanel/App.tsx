import { useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import type {
  AzureDevOpsConnectionInfo,
  AzureDevOpsConnectionMode,
  AzureDevOpsConnectionStatus,
  AzureDevOpsProjectOption,
  AzureDevOpsTeamOption,
  AiRefinementResult,
  AutomationCandidateMappingResult,
  AutomationMappingOptions,
  BoardBriefing,
  BoardKnowledgeSource,
  BoardKnowledgeSourceType,
  BoardKnowledgeUploadDraft,
  BoardScope,
  BoardSummary,
  CurrentQaUserSettings,
  KnowledgeExtractionResult,
  LlmProviderConfigurationSummary,
  ReviewExportFormat,
  ReviewExportResult,
  ReviewExportSection,
  StoryLinkedKnowledgeEvidence,
  StoryAnalysisAssistResult,
  StoryRequirementAnalysis,
  TestCaseDraftGenerationResult,
  TestCaseDraftSelectedInputs,
  ReviewedTestCase,
  TestCaseDraft,
  TestCaseReviewSession,
  TestPlansCreationResult,
  TestPlansReadinessResult,
  TestPlansTargetSettings,
  WorkItemDetail,
  WorkRecommendation,
  WritebackHelperType,
  WritebackPreviewResult
} from "@qa-assist/shared";
import {
  analyzeStoryRequirements,
  type BoardSummaryPreviewResponse,
  connectAzureDevOps,
  createTestPlansCases,
  extractBoardKnowledgeText,
  exportReviewPackage,
  fetchBoardSummaryPreview,
  fetchWorkItemDetail,
  fetchLlmProviderStatus,
  generateBoardBriefing,
  generateTestCaseDrafts,
  listAzureTeams,
  mapAutomationCandidates,
  normalizeReviewedTestCases,
  previewTestPlansReadiness,
  previewWritebackHelper,
  requestAiRefinement,
  requestStoryAnalysisAssist,
  summarizeBoardKnowledge,
  validateBoardKnowledgeSource
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
type StoryAnalysisStatus = "idle" | "loading" | "success" | "error";
type AiAssistStatus = "idle" | "loading" | "success" | "error";
type DraftGenerationStatus = "idle" | "loading" | "success" | "error";
type ReviewStatus = "idle" | "loading" | "success" | "error";
type TestPlansReadinessStatus = "idle" | "loading" | "success" | "error";
type TestPlansCreationRequestStatus = "idle" | "loading" | "success" | "error";
type AutomationMappingStatus = "idle" | "loading" | "success" | "error";
type ReviewExportStatus = "idle" | "loading" | "success" | "error";
type WritebackPreviewRequestStatus = "idle" | "loading" | "success" | "error";
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
  testPlanId: string;
  testSuiteId: string;
  testManagementAreaPath: string;
  testManagementIterationPath: string;
  boardKnowledgeSources: BoardKnowledgeSource[];
};

const THEME_STORAGE_KEY = "qaAssistTheme";
const SETTINGS_STORAGE_KEY = "qaAssistSettings";
const DEFAULT_API_BASE_URL = "http://127.0.0.1:4317";
const DEFAULT_EXPORT_SECTIONS: ReviewExportSection[] = [
  "story-context",
  "story-analysis",
  "review-session",
  "test-plans-readiness",
  "automation-candidates"
];
const REVIEW_EXPORT_SECTION_OPTIONS: Array<{ label: string; value: ReviewExportSection }> = [
  { label: "Story context", value: "story-context" },
  { label: "Story analysis", value: "story-analysis" },
  { label: "AI assist", value: "ai-assist" },
  { label: "Draft cases", value: "draft-cases" },
  { label: "Review session", value: "review-session" },
  { label: "Readiness", value: "test-plans-readiness" },
  { label: "Creation results", value: "test-plans-creation" },
  { label: "Automation", value: "automation-candidates" }
];
const WRITEBACK_HELPER_OPTIONS: Array<{ label: string; value: WritebackHelperType }> = [
  { label: "Bug draft", value: "bug-draft" },
  { label: "Comment draft", value: "comment-draft" },
  { label: "State transition", value: "state-transition" },
  { label: "Attachment metadata", value: "attachment-metadata" }
];
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
  currentQaUserEmail: "",
  testPlanId: "",
  testSuiteId: "",
  testManagementAreaPath: "",
  testManagementIterationPath: "",
  boardKnowledgeSources: []
};

const BOARD_KNOWLEDGE_SOURCE_TYPE_OPTIONS: Array<{ label: string; value: BoardKnowledgeSourceType }> = [
  { label: "Requirement document", value: "requirement-document" },
  { label: "Meeting transcript", value: "meeting-transcript" },
  { label: "BA/PO Q&A", value: "ba-po-qa" },
  { label: "Product rule", value: "product-rule" },
  { label: "Release note", value: "release-note" },
  { label: "Test note", value: "test-note" },
  { label: "Known risk", value: "known-risk" },
  { label: "Automation reference", value: "automation-reference" },
  { label: "Other", value: "other" }
];

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
  const [storyAnalysisStatus, setStoryAnalysisStatus] = useState<StoryAnalysisStatus>("idle");
  const [storyAnalysisMessage, setStoryAnalysisMessage] = useState<string>("Fetch story details first.");
  const [storyAnalysis, setStoryAnalysis] = useState<StoryRequirementAnalysis | null>(null);
  const [llmProviderStatus, setLlmProviderStatus] = useState<LlmProviderConfigurationSummary | null>(null);
  const [llmProviderMessage, setLlmProviderMessage] = useState("AI provider status has not been checked yet.");
  const [aiAssistStatus, setAiAssistStatus] = useState<AiAssistStatus>("idle");
  const [aiAssistMessage, setAiAssistMessage] = useState("Run deterministic Story analysis first.");
  const [aiAssistResult, setAiAssistResult] = useState<StoryAnalysisAssistResult | null>(null);
  const [draftRefinementStatus, setDraftRefinementStatus] = useState<AiAssistStatus>("idle");
  const [draftRefinementMessage, setDraftRefinementMessage] = useState("Generate draft cases before requesting AI refinement.");
  const [draftRefinementResult, setDraftRefinementResult] = useState<AiRefinementResult | null>(null);
  const [automationRefinementStatus, setAutomationRefinementStatus] = useState<AiAssistStatus>("idle");
  const [automationRefinementMessage, setAutomationRefinementMessage] = useState("Map automation candidates before requesting AI refinement.");
  const [automationRefinementResult, setAutomationRefinementResult] = useState<AiRefinementResult | null>(null);
  const [writebackRefinementStatus, setWritebackRefinementStatus] = useState<AiAssistStatus>("idle");
  const [writebackRefinementMessage, setWritebackRefinementMessage] = useState("Preview a write-back helper before requesting AI wording refinement.");
  const [writebackRefinementResult, setWritebackRefinementResult] = useState<AiRefinementResult | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftGenerationStatus>("idle");
  const [draftMessage, setDraftMessage] = useState("Analyze requirements before drafting test cases.");
  const [draftResult, setDraftResult] = useState<TestCaseDraftGenerationResult | null>(null);
  const [reviewCases, setReviewCases] = useState<ReviewedTestCase[]>([]);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("idle");
  const [reviewMessage, setReviewMessage] = useState("Generate draft cases before review.");
  const [reviewSession, setReviewSession] = useState<TestCaseReviewSession | null>(null);
  const [testPlansReadinessStatus, setTestPlansReadinessStatus] = useState<TestPlansReadinessStatus>("idle");
  const [testPlansReadinessMessage, setTestPlansReadinessMessage] = useState("Validate review decisions before previewing Azure Test Plans readiness.");
  const [testPlansReadiness, setTestPlansReadiness] = useState<TestPlansReadinessResult | null>(null);
  const [selectedTestPlansCandidateIds, setSelectedTestPlansCandidateIds] = useState<string[]>([]);
  const [testPlansCreationConfirmed, setTestPlansCreationConfirmed] = useState(false);
  const [testPlansCreationStatus, setTestPlansCreationStatus] = useState<TestPlansCreationRequestStatus>("idle");
  const [testPlansCreationMessage, setTestPlansCreationMessage] = useState("Preview readiness, select candidates, then confirm before creating in Azure Test Plans.");
  const [testPlansCreationResult, setTestPlansCreationResult] = useState<TestPlansCreationResult | null>(null);
  const [automationMappingStatus, setAutomationMappingStatus] = useState<AutomationMappingStatus>("idle");
  const [automationMappingMessage, setAutomationMappingMessage] = useState("Validate review decisions before mapping automation candidates.");
  const [automationMappingResult, setAutomationMappingResult] = useState<AutomationCandidateMappingResult | null>(null);
  const [automationMappingOptions, setAutomationMappingOptions] = useState<Required<AutomationMappingOptions>>({
    preferUi: true,
    preferApi: false,
    includeBlocked: false
  });
  const [reviewExportStatus, setReviewExportStatus] = useState<ReviewExportStatus>("idle");
  const [reviewExportMessage, setReviewExportMessage] = useState("Export package is available after useful Story data exists.");
  const [reviewExportResult, setReviewExportResult] = useState<ReviewExportResult | null>(null);
  const [reviewExportFormat, setReviewExportFormat] = useState<ReviewExportFormat>("markdown");
  const [reviewExportSections, setReviewExportSections] = useState<ReviewExportSection[]>(DEFAULT_EXPORT_SECTIONS);
  const [writebackPreviewStatus, setWritebackPreviewStatus] = useState<WritebackPreviewRequestStatus>("idle");
  const [writebackPreviewMessage, setWritebackPreviewMessage] = useState("Preview helpers are available after useful Story data exists.");
  const [writebackPreviewResult, setWritebackPreviewResult] = useState<WritebackPreviewResult | null>(null);
  const [writebackHelperType, setWritebackHelperType] = useState<WritebackHelperType>("comment-draft");
  const [writebackUserNotes, setWritebackUserNotes] = useState("");
  const [writebackTargetState, setWritebackTargetState] = useState("");
  const [writebackAttachmentFileName, setWritebackAttachmentFileName] = useState("");
  const [writebackAttachmentContentType, setWritebackAttachmentContentType] = useState("");
  const [writebackAttachmentSizeBytes, setWritebackAttachmentSizeBytes] = useState("");
  const [draftInputs, setDraftInputs] = useState<Required<TestCaseDraftSelectedInputs>>({
    includePositivePath: true,
    includeNegativePath: true,
    includeRegression: true,
    includeLinkedKnowledge: false,
    includeUserConfirmedNotes: true
  });
  const [selectedKnowledgeSourceIds, setSelectedKnowledgeSourceIds] = useState<string[]>([]);
  const [includeLatestExtraction, setIncludeLatestExtraction] = useState(false);
  const [userConfirmedNote, setUserConfirmedNote] = useState("");
  const [latestExtractionResult, setLatestExtractionResult] = useState<KnowledgeExtractionResult | null>(null);
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
    let cancelled = false;

    async function loadProviderStatus(): Promise<void> {
      try {
        const status = await fetchLlmProviderStatus(settings.apiBaseUrl);
        if (cancelled) return;
        setLlmProviderStatus(status);
        setLlmProviderMessage(formatProviderStatusMessage(status));
      } catch (error) {
        if (cancelled) return;
        setLlmProviderStatus(null);
        setLlmProviderMessage(error instanceof Error ? error.message : "AI provider status could not be loaded.");
      }
    }

    void loadProviderStatus();

    return () => {
      cancelled = true;
    };
  }, [settings.apiBaseUrl]);

  useEffect(() => {
    setWorkItemDetail(null);
    setStoryDetailStatus("idle");
    setStoryDetailMessage(pageContext ? "Fetch story details to begin." : "Open an Azure DevOps work item and fetch details.");
    setStoryAnalysis(null);
    setStoryAnalysisStatus("idle");
    setStoryAnalysisMessage("Fetch story details first.");
    resetAiAssist("Run deterministic Story analysis first.");
    setDraftResult(null);
    setDraftStatus("idle");
    setDraftMessage("Analyze requirements before drafting test cases.");
    resetDraftRefinement("Story detail changed. Generate draft cases before requesting AI refinement.");
    resetDraftRefinement("Story context changed. Generate draft cases before requesting AI refinement.");
    resetTestCaseReviewState("Generate draft cases before review.");
    resetTestPlansReadiness("Validate review decisions before previewing Azure Test Plans readiness.");
    resetAutomationMapping("Validate review decisions before mapping automation candidates.");
    resetReviewExport("Story context changed. Generate a fresh export package after useful data exists.");
    resetWritebackPreview("Story context changed. Preview helper again when ready.");
    setSelectedKnowledgeSourceIds([]);
    setIncludeLatestExtraction(false);
    setUserConfirmedNote("");
  }, [pageContext?.organization, pageContext?.project, pageContext?.workItemId]);

  useEffect(() => {
    resetTestPlansReadiness("Test management target changed. Validate review decisions before previewing readiness.");
    resetTestPlansCreation("Target settings changed. Preview readiness again before creating in Azure Test Plans.");
  }, [settings.testPlanId, settings.testSuiteId, settings.testManagementAreaPath, settings.testManagementIterationPath]);

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
    setStoryAnalysis(null);
    setStoryAnalysisStatus("idle");
    setStoryAnalysisMessage("Fetch story details first.");
    resetAiAssist("Run deterministic Story analysis first.");
    setDraftResult(null);
    setDraftStatus("idle");
    setDraftMessage("Analyze requirements before drafting test cases.");
    resetTestCaseReviewState("Generate draft cases before review.");
    resetTestPlansReadiness("Validate review decisions before previewing Azure Test Plans readiness.");
    resetAutomationMapping("Validate review decisions before mapping automation candidates.");
    resetReviewExport("Story detail fetch started. Export after the latest data is ready.");
    resetWritebackPreview("Story detail fetch started. Preview helper after the latest data is ready.");

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
      setStoryAnalysisMessage("Ready for evidence-bound preview analysis.");
    } catch (error) {
      setWorkItemDetail(null);
      setStoryAnalysis(null);
      setStoryDetailStatus("error");
      setStoryDetailMessage(error instanceof Error ? error.message : "Work item detail fetch failed.");
      setStoryAnalysisStatus("idle");
      setStoryAnalysisMessage("Fetch story details first.");
    }
  }

  async function analyzeStory(): Promise<void> {
    if (!workItemDetail) {
      setStoryAnalysisStatus("error");
      setStoryAnalysisMessage("Fetch story details first.");
      return;
    }

    setStoryAnalysisStatus("loading");
    setStoryAnalysisMessage("Generating deterministic evidence-bound preview...");

    try {
      const linkedKnowledgeEvidence = buildLinkedKnowledgeEvidence({
        settings,
        canLinkKnowledge: canLinkKnowledgeForStory(settings, pageContext, workItemDetail),
        selectedKnowledgeSourceIds,
        includeLatestExtraction,
        latestExtractionResult,
        userConfirmedNote
      });
      const analysis = await analyzeStoryRequirements(settings.apiBaseUrl, {
        workItem: workItemDetail,
        linkedKnowledgeEvidence
      });
      setStoryAnalysis(analysis);
      setStoryAnalysisStatus("success");
      setStoryAnalysisMessage("Evidence-bound preview analysis is ready.");
      resetAiAssist("Deterministic analysis is ready. Request AI assist only if the backend provider is available.");
      setDraftResult(null);
      setDraftStatus("idle");
      setDraftMessage("Analysis is ready. Draft cases are still not generated.");
      resetDraftRefinement("Story analysis changed. Generate draft cases before requesting AI refinement.");
      resetTestCaseReviewState("Generate draft cases before review.");
      resetTestPlansReadiness("Validate review decisions before previewing Azure Test Plans readiness.");
      resetAutomationMapping("Validate review decisions before mapping automation candidates.");
      resetReviewExport("Story analysis changed. Generate a fresh export package when ready.");
      resetWritebackPreview("Story analysis changed. Preview helper again when ready.");
    } catch (error) {
      setStoryAnalysis(null);
      setStoryAnalysisStatus("error");
      setStoryAnalysisMessage(error instanceof Error ? error.message : "Requirement analysis failed.");
      resetAiAssist("Run deterministic Story analysis first.");
      setDraftResult(null);
      setDraftStatus("idle");
      setDraftMessage("Analyze requirements before drafting test cases.");
      resetDraftRefinement("Story analysis failed. Generate draft cases before requesting AI refinement.");
      resetTestCaseReviewState("Generate draft cases before review.");
      resetTestPlansReadiness("Validate review decisions before previewing Azure Test Plans readiness.");
      resetAutomationMapping("Validate review decisions before mapping automation candidates.");
      resetReviewExport("Story analysis failed. Export after useful data exists.");
      resetWritebackPreview("Story analysis failed. Preview helper after useful data exists.");
    }
  }

  function resetTestCaseReviewState(message: string): void {
    setReviewCases([]);
    setReviewSession(null);
    setReviewStatus("idle");
    setReviewMessage(message);
    resetAutomationMapping("Validate review decisions before mapping automation candidates.");
    resetReviewExport("Review state changed. Generate a fresh export package when ready.");
    resetWritebackPreview("Review state changed. Preview helper again when ready.");
  }

  function resetAiAssist(message: string): void {
    setAiAssistResult(null);
    setAiAssistStatus("idle");
    setAiAssistMessage(message);
  }

  function resetDraftRefinement(message: string): void {
    setDraftRefinementResult(null);
    setDraftRefinementStatus("idle");
    setDraftRefinementMessage(message);
  }

  function resetAutomationRefinement(message: string): void {
    setAutomationRefinementResult(null);
    setAutomationRefinementStatus("idle");
    setAutomationRefinementMessage(message);
  }

  function resetWritebackRefinement(message: string): void {
    setWritebackRefinementResult(null);
    setWritebackRefinementStatus("idle");
    setWritebackRefinementMessage(message);
  }

  async function requestAiAssist(): Promise<void> {
    if (!workItemDetail || !storyAnalysis) {
      setAiAssistStatus("error");
      setAiAssistMessage("Run deterministic Story analysis first.");
      return;
    }

    if (llmProviderStatus?.availability !== "available") {
      setAiAssistStatus("error");
      setAiAssistMessage(llmProviderStatus?.reason ?? "AI provider is disabled or misconfigured on the backend.");
      return;
    }

    setAiAssistStatus("loading");
    setAiAssistMessage("Requesting backend-mediated AI suggestions...");

    try {
      const result = await requestStoryAnalysisAssist(settings.apiBaseUrl, {
        workItem: workItemDetail,
        deterministicAnalysis: storyAnalysis
      });
      setAiAssistResult(result);
      setAiAssistStatus("success");
      setAiAssistMessage("AI-assisted suggestions returned. QA review is required.");
    } catch (error) {
      setAiAssistResult(null);
      setAiAssistStatus("error");
      setAiAssistMessage(error instanceof Error ? error.message : "AI assist request failed.");
    }
  }

  async function requestDraftCaseRefinement(): Promise<void> {
    if (!draftResult) {
      setDraftRefinementStatus("error");
      setDraftRefinementMessage("Generate deterministic draft cases first.");
      return;
    }

    if (llmProviderStatus?.availability !== "available") {
      setDraftRefinementStatus("error");
      setDraftRefinementMessage(llmProviderStatus?.reason ?? "AI provider is disabled or misconfigured on the backend.");
      return;
    }

    setDraftRefinementStatus("loading");
    setDraftRefinementMessage("Requesting AI refinement for draft cases...");

    try {
      const result = await requestAiRefinement(settings.apiBaseUrl, {
        target: "draft-test-cases",
        deterministicInput: draftResult,
        contextSummary: storyAnalysis?.headline,
        reviewedSessionSummary: reviewSession ? `Reviewed ${reviewSession.summary.totalReviewed} case(s); ${reviewSession.summary.readyForExport} ready for later export.` : undefined
      });
      setDraftRefinementResult(result);
      setDraftRefinementStatus("success");
      setDraftRefinementMessage("AI draft case refinements returned. Apply manually only after QA review.");
    } catch (error) {
      setDraftRefinementResult(null);
      setDraftRefinementStatus("error");
      setDraftRefinementMessage(error instanceof Error ? error.message : "AI draft case refinement failed.");
    }
  }

  async function requestAutomationRefinement(): Promise<void> {
    if (!automationMappingResult) {
      setAutomationRefinementStatus("error");
      setAutomationRefinementMessage("Map deterministic automation candidates first.");
      return;
    }

    if (llmProviderStatus?.availability !== "available") {
      setAutomationRefinementStatus("error");
      setAutomationRefinementMessage(llmProviderStatus?.reason ?? "AI provider is disabled or misconfigured on the backend.");
      return;
    }

    setAutomationRefinementStatus("loading");
    setAutomationRefinementMessage("Requesting AI refinement for automation mapping...");

    try {
      const result = await requestAiRefinement(settings.apiBaseUrl, {
        target: "automation-candidates",
        deterministicInput: automationMappingResult,
        contextSummary: "Refine rationale, blockers, and starting points. Do not generate automation code."
      });
      setAutomationRefinementResult(result);
      setAutomationRefinementStatus("success");
      setAutomationRefinementMessage("AI automation refinements returned. No code was generated.");
    } catch (error) {
      setAutomationRefinementResult(null);
      setAutomationRefinementStatus("error");
      setAutomationRefinementMessage(error instanceof Error ? error.message : "AI automation refinement failed.");
    }
  }

  async function requestWritebackRefinement(): Promise<void> {
    if (!writebackPreviewResult) {
      setWritebackRefinementStatus("error");
      setWritebackRefinementMessage("Preview a write-back helper first.");
      return;
    }

    if (llmProviderStatus?.availability !== "available") {
      setWritebackRefinementStatus("error");
      setWritebackRefinementMessage(llmProviderStatus?.reason ?? "AI provider is disabled or misconfigured on the backend.");
      return;
    }

    setWritebackRefinementStatus("loading");
    setWritebackRefinementMessage("Requesting AI wording refinement for the preview helper...");

    try {
      const result = await requestAiRefinement(settings.apiBaseUrl, {
        target: "writeback-helper",
        deterministicInput: writebackPreviewResult,
        contextSummary: "Refine wording only. Do not submit or create anything.",
        userPromptNote: writebackUserNotes
      });
      setWritebackRefinementResult(result);
      setWritebackRefinementStatus("success");
      setWritebackRefinementMessage("AI write-back wording suggestions returned. Nothing was submitted.");
    } catch (error) {
      setWritebackRefinementResult(null);
      setWritebackRefinementStatus("error");
      setWritebackRefinementMessage(error instanceof Error ? error.message : "AI write-back refinement failed.");
    }
  }

  function resetTestPlansReadiness(message: string): void {
    setTestPlansReadiness(null);
    setTestPlansReadinessStatus("idle");
    setTestPlansReadinessMessage(message);
    setSelectedTestPlansCandidateIds([]);
    setTestPlansCreationConfirmed(false);
    resetTestPlansCreation("Preview readiness, select candidates, then confirm before creating in Azure Test Plans.");
  }

  function resetTestPlansCreation(message: string): void {
    setTestPlansCreationResult(null);
    setTestPlansCreationStatus("idle");
    setTestPlansCreationMessage(message);
  }

  function resetAutomationMapping(message: string): void {
    setAutomationMappingResult(null);
    setAutomationMappingStatus("idle");
    setAutomationMappingMessage(message);
    resetAutomationRefinement("Automation mapping changed. Request AI refinement after a fresh mapping.");
    resetReviewExport("Automation mapping changed. Generate a fresh export package when ready.");
  }

  function resetReviewExport(message: string): void {
    setReviewExportResult(null);
    setReviewExportStatus("idle");
    setReviewExportMessage(message);
    resetWritebackPreview("Export package changed. Preview helper again when ready.");
  }

  function resetWritebackPreview(message: string): void {
    setWritebackPreviewResult(null);
    setWritebackPreviewStatus("idle");
    setWritebackPreviewMessage(message);
    resetWritebackRefinement("Write-back helper changed. Request AI wording refinement after a fresh preview.");
  }

  function updateReviewCases(nextReviewCases: ReviewedTestCase[]): void {
    setReviewCases(nextReviewCases);
    resetTestPlansReadiness("Review decisions changed. Validate review decisions before previewing Azure Test Plans readiness.");
    resetAutomationMapping("Review decisions changed. Validate review decisions before mapping automation candidates.");
    resetReviewExport("Review decisions changed. Generate a fresh export package after validation.");
    resetWritebackPreview("Review decisions changed. Preview helper after validation.");
  }

  async function generateDraftCases(): Promise<void> {
    if (!workItemDetail || !storyAnalysis) {
      setDraftStatus("error");
      setDraftMessage("Analyze requirements before drafting test cases.");
      return;
    }

    setDraftStatus("loading");
    setDraftMessage("Generating deterministic draft cases...");

    try {
      const result = await generateTestCaseDrafts(settings.apiBaseUrl, {
        workItem: workItemDetail,
        analysis: storyAnalysis,
        selectedDraftInputs: draftInputs
      });

      setDraftResult(result);
      resetDraftRefinement("Draft cases changed. Request AI refinement only if useful.");
      setReviewCases(result.draftCases.map(createReviewedCaseFromDraft));
      setReviewSession(null);
      setReviewStatus("idle");
      setReviewMessage("Review generated drafts locally. Nothing is exported or written back.");
      resetTestPlansReadiness("Validate review decisions before previewing Azure Test Plans readiness.");
      resetAutomationMapping("Validate review decisions before mapping automation candidates.");
      resetReviewExport("Draft cases changed. Generate a fresh export package when ready.");
      resetWritebackPreview("Draft cases changed. Preview helper again when ready.");
      setDraftStatus("success");
      setDraftMessage("Draft cases generated. QA review is required before use.");
    } catch (error) {
      setDraftResult(null);
      resetDraftRefinement("Draft generation failed. Generate draft cases before requesting AI refinement.");
      resetTestCaseReviewState("Generate draft cases before review.");
      resetTestPlansReadiness("Validate review decisions before previewing Azure Test Plans readiness.");
      resetAutomationMapping("Validate review decisions before mapping automation candidates.");
      resetReviewExport("Draft generation failed. Export after useful data exists.");
      resetWritebackPreview("Draft generation failed. Preview helper after useful data exists.");
      setDraftStatus("error");
      setDraftMessage(error instanceof Error ? error.message : "Draft generation failed.");
    }
  }

  async function validateReviewDecisions(): Promise<void> {
    if (!workItemDetail || !draftResult) {
      setReviewStatus("error");
      setReviewMessage("Generate draft cases before validating review decisions.");
      return;
    }

    setReviewStatus("loading");
    setReviewMessage("Validating local review decisions...");
    resetTestPlansReadiness("Review validation is running. Preview readiness after validation succeeds.");
    resetAutomationMapping("Review validation is running. Map automation candidates after validation succeeds.");
    resetReviewExport("Review validation is running. Export after validation succeeds.");
    resetWritebackPreview("Review validation is running. Preview helper after validation succeeds.");

    try {
      const session = await normalizeReviewedTestCases(settings.apiBaseUrl, {
        workItem: {
          workItemId: workItemDetail.workItemId,
          title: workItemDetail.title
        },
        draftResult,
        reviewedCases: reviewCases
      });

      setReviewSession(session);
      setReviewCases(session.reviewedCases);
      setReviewStatus("success");
      setReviewMessage("Review decisions validated locally. Nothing was created in Azure Test Plans.");
      resetTestPlansReadiness("Review decisions validated. Preview Azure Test Plans readiness when ready.");
      resetAutomationMapping("Review decisions validated. Map automation candidates when ready.");
      resetReviewExport("Review decisions validated. Generate export package when ready.");
      resetWritebackPreview("Review decisions validated. Preview helper when ready.");
    } catch (error) {
      setReviewSession(null);
      setReviewStatus("error");
      setReviewMessage(error instanceof Error ? error.message : "Review validation failed.");
      resetTestPlansReadiness("Validate review decisions before previewing Azure Test Plans readiness.");
      resetAutomationMapping("Validate review decisions before mapping automation candidates.");
      resetReviewExport("Review validation failed. Export after useful data exists.");
      resetWritebackPreview("Review validation failed. Preview helper after useful data exists.");
    }
  }

  async function mapReviewedAutomationCandidates(): Promise<void> {
    if (!reviewSession) {
      setAutomationMappingStatus("error");
      setAutomationMappingMessage("Validate review decisions before mapping automation candidates.");
      return;
    }

    setAutomationMappingStatus("loading");
    setAutomationMappingMessage("Mapping automation candidates. No code or repo changes will be created.");

    try {
      const result = await mapAutomationCandidates(settings.apiBaseUrl, {
        reviewSession,
        mappingOptions: automationMappingOptions
      });

      setAutomationMappingResult(result);
      setAutomationMappingStatus("success");
      setAutomationMappingMessage("Automation candidate mapping is ready. Planning only - no automation code created.");
      resetReviewExport("Automation mapping is ready. Generate export package when ready.");
      resetWritebackPreview("Automation mapping changed. Preview helper again when ready.");
    } catch (error) {
      setAutomationMappingResult(null);
      setAutomationMappingStatus("error");
      setAutomationMappingMessage(error instanceof Error ? error.message : "Automation candidate mapping failed.");
      resetReviewExport("Automation mapping failed. Generate export package after useful data exists.");
      resetWritebackPreview("Automation mapping failed. Preview helper after useful data exists.");
    }
  }

  async function previewAzureTestPlansReadiness(): Promise<void> {
    if (!reviewSession) {
      setTestPlansReadinessStatus("error");
      setTestPlansReadinessMessage("Validate review decisions before previewing Azure Test Plans readiness.");
      return;
    }

    if (!hasSelectedTeamBoard(settings)) {
      setTestPlansReadinessStatus("error");
      setTestPlansReadinessMessage("Select a team board before previewing Azure Test Plans readiness.");
      return;
    }

    setTestPlansReadinessStatus("loading");
    setTestPlansReadinessMessage("Building readiness preview. Nothing will be created in Azure.");

    try {
      const result = await previewTestPlansReadiness(settings.apiBaseUrl, {
        reviewSession,
        targetSettings: buildTestPlansTargetSettings(settings)
      });

      setTestPlansReadiness(result);
      setTestPlansReadinessStatus("success");
      setTestPlansReadinessMessage("Readiness preview generated. Nothing was created or updated in Azure Test Plans.");
      setSelectedTestPlansCandidateIds([]);
      setTestPlansCreationConfirmed(false);
      resetTestPlansCreation("Select readiness candidates and confirm before creating in Azure Test Plans.");
      resetReviewExport("Readiness preview changed. Generate a fresh export package when ready.");
      resetWritebackPreview("Readiness preview changed. Preview helper again when ready.");
    } catch (error) {
      setTestPlansReadiness(null);
      setTestPlansReadinessStatus("error");
      setTestPlansReadinessMessage(error instanceof Error ? error.message : "Azure Test Plans readiness preview failed.");
      setSelectedTestPlansCandidateIds([]);
      setTestPlansCreationConfirmed(false);
      resetTestPlansCreation("Preview readiness before creating in Azure Test Plans.");
      resetReviewExport("Readiness preview failed. Generate export package after useful data exists.");
      resetWritebackPreview("Readiness preview failed. Preview helper after useful data exists.");
    }
  }

  function updateSelectedTestPlansCandidateIds(candidateIds: string[]): void {
    setSelectedTestPlansCandidateIds(candidateIds);
    setTestPlansCreationConfirmed(false);
    resetTestPlansCreation("Candidate selection changed. Confirm again before creating selected test cases.");
    resetReviewExport("Test Plans candidate selection changed. Generate a fresh export package when ready.");
    resetWritebackPreview("Test Plans candidate selection changed. Preview helper again when ready.");
  }

  async function createSelectedAzureTestPlansCases(): Promise<void> {
    if (!testPlansReadiness) {
      setTestPlansCreationStatus("error");
      setTestPlansCreationMessage("Preview readiness before creating in Azure Test Plans.");
      return;
    }

    if (selectedTestPlansCandidateIds.length === 0) {
      setTestPlansCreationStatus("error");
      setTestPlansCreationMessage("Select at least one readiness candidate before creating in Azure Test Plans.");
      return;
    }

    if (!testPlansCreationConfirmed) {
      setTestPlansCreationStatus("error");
      setTestPlansCreationMessage("Final confirmation is required before Azure Test Plans creation.");
      return;
    }

    setTestPlansCreationStatus("loading");
    setTestPlansCreationMessage("Creating only the selected test cases in Azure Test Plans...");

    try {
      const result = await createTestPlansCases(settings.apiBaseUrl, {
        readinessResult: testPlansReadiness,
        selectedCandidateIds: selectedTestPlansCandidateIds,
        confirmation: {
          confirmedByUser: true,
          confirmationText: "I confirm QA Assist should create only the selected test cases in Azure Test Plans.",
          confirmedAt: new Date().toISOString()
        }
      });

      setTestPlansCreationResult(result);
      setTestPlansCreationStatus("success");
      setTestPlansCreationConfirmed(false);
      setTestPlansCreationMessage("Azure Test Plans creation completed for the explicit selection. Review created, failed, and skipped items.");
      resetReviewExport("Creation result changed. Generate a fresh export package when ready.");
      resetWritebackPreview("Creation result changed. Preview helper again when ready.");
    } catch (error) {
      setTestPlansCreationResult(null);
      setTestPlansCreationStatus("error");
      setTestPlansCreationConfirmed(false);
      setTestPlansCreationMessage(error instanceof Error ? error.message : "Azure Test Plans creation failed.");
      resetReviewExport("Creation failed. Generate export package after useful data exists.");
      resetWritebackPreview("Creation failed. Preview helper after useful data exists.");
    }
  }

  async function generateReviewExportPackage(): Promise<void> {
    if (!hasExportableStoryData({
      workItemDetail,
      storyAnalysis,
      aiAssistResult,
      draftResult,
      reviewSession,
      testPlansReadiness,
      testPlansCreationResult,
      automationMappingResult
    })) {
      setReviewExportStatus("error");
      setReviewExportMessage("Fetch or generate useful Story data before exporting a review package.");
      return;
    }

    setReviewExportStatus("loading");
    setReviewExportMessage("Packaging current QA Assist session output. Nothing will be written externally.");

    try {
      const result = await exportReviewPackage(settings.apiBaseUrl, {
        format: reviewExportFormat,
        selectedSections: reviewExportSections,
        workItemDetail: workItemDetail ?? undefined,
        storyAnalysis: storyAnalysis ?? undefined,
        aiAssistResult: aiAssistResult ?? undefined,
        draftResult: draftResult ?? undefined,
        reviewSession: reviewSession ?? undefined,
        readinessResult: testPlansReadiness ?? undefined,
        creationResult: testPlansCreationResult ?? undefined,
        automationMappingResult: automationMappingResult ?? undefined
      });

      setReviewExportResult(result);
      setReviewExportStatus("success");
      setReviewExportMessage("Review package generated locally. Copy or download it when ready.");
    } catch (error) {
      setReviewExportResult(null);
      setReviewExportStatus("error");
      setReviewExportMessage(error instanceof Error ? error.message : "Export package generation failed.");
    }
  }

  function updateReviewExportFormat(format: ReviewExportFormat): void {
    setReviewExportFormat(format);
    resetReviewExport("Export format changed. Generate a fresh review package.");
  }

  function updateReviewExportSections(sections: ReviewExportSection[]): void {
    setReviewExportSections(sections);
    resetReviewExport("Export sections changed. Generate a fresh review package.");
  }

  async function previewSelectedWritebackHelper(): Promise<void> {
    if (!hasExportableStoryData({
      workItemDetail,
      storyAnalysis,
      aiAssistResult,
      draftResult,
      reviewSession,
      testPlansReadiness,
      testPlansCreationResult,
      automationMappingResult
    })) {
      setWritebackPreviewStatus("error");
      setWritebackPreviewMessage("Fetch or generate useful Story data before previewing write-back helpers.");
      return;
    }

    setWritebackPreviewStatus("loading");
    setWritebackPreviewMessage("Building preview only. Nothing will be written to Azure DevOps.");

    try {
      const result = await previewWritebackHelper(settings.apiBaseUrl, {
        helperType: writebackHelperType,
        workItemDetail: workItemDetail ?? undefined,
        reviewSession: reviewSession ?? undefined,
        selectedEvidence: buildWritebackEvidence(storyAnalysis, reviewSession),
        userNotes: writebackUserNotes,
        targetState: writebackTargetState,
        attachmentMetadata: {
          fileName: writebackAttachmentFileName,
          contentType: normalizeOptional(writebackAttachmentContentType),
          sizeBytes: writebackAttachmentSizeBytes.trim() ? Number(writebackAttachmentSizeBytes) : undefined,
          sourceLabel: "QA Assist session evidence metadata"
        }
      });

      setWritebackPreviewResult(result);
      setWritebackPreviewStatus("success");
      setWritebackPreviewMessage("Write-back helper preview generated. Final submission is not implemented in this step.");
    } catch (error) {
      setWritebackPreviewResult(null);
      setWritebackPreviewStatus("error");
      setWritebackPreviewMessage(error instanceof Error ? error.message : "Write-back helper preview failed.");
    }
  }

  function updateWritebackHelperType(helperType: WritebackHelperType): void {
    setWritebackHelperType(helperType);
    resetWritebackPreview("Helper type changed. Preview again when ready.");
  }

  function updateWritebackUserNotes(notes: string): void {
    setWritebackUserNotes(notes);
    resetWritebackPreview("Notes changed. Preview again when ready.");
  }

  function updateWritebackTargetState(targetState: string): void {
    setWritebackTargetState(targetState);
    resetWritebackPreview("Target state changed. Preview again when ready.");
  }

  function updateWritebackAttachmentFileName(fileName: string): void {
    setWritebackAttachmentFileName(fileName);
    resetWritebackPreview("Attachment metadata changed. Preview again when ready.");
  }

  function updateWritebackAttachmentContentType(contentType: string): void {
    setWritebackAttachmentContentType(contentType);
    resetWritebackPreview("Attachment metadata changed. Preview again when ready.");
  }

  function updateWritebackAttachmentSizeBytes(sizeBytes: string): void {
    setWritebackAttachmentSizeBytes(sizeBytes);
    resetWritebackPreview("Attachment metadata changed. Preview again when ready.");
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
          storyAnalysisStatus,
          storyAnalysisMessage,
          storyAnalysis,
          llmProviderStatus,
          llmProviderMessage,
          aiAssistStatus,
          aiAssistMessage,
          aiAssistResult,
          draftStatus,
          draftMessage,
          draftResult,
          draftRefinementStatus,
          draftRefinementMessage,
          draftRefinementResult,
          reviewCases,
          setReviewCases: updateReviewCases,
          reviewStatus,
          reviewMessage,
          reviewSession,
          testPlansReadinessStatus,
          testPlansReadinessMessage,
          testPlansReadiness,
          selectedTestPlansCandidateIds,
          testPlansCreationConfirmed,
          testPlansCreationStatus,
          testPlansCreationMessage,
          testPlansCreationResult,
          automationMappingStatus,
          automationMappingMessage,
          automationMappingResult,
          automationMappingOptions,
          setAutomationMappingOptions,
          automationRefinementStatus,
          automationRefinementMessage,
          automationRefinementResult,
          reviewExportStatus,
          reviewExportMessage,
          reviewExportResult,
          reviewExportFormat,
          setReviewExportFormat: updateReviewExportFormat,
          reviewExportSections,
          setReviewExportSections: updateReviewExportSections,
          writebackPreviewStatus,
          writebackPreviewMessage,
          writebackPreviewResult,
          writebackHelperType,
          setWritebackHelperType: updateWritebackHelperType,
          writebackUserNotes,
          setWritebackUserNotes: updateWritebackUserNotes,
          writebackTargetState,
          setWritebackTargetState: updateWritebackTargetState,
          writebackAttachmentFileName,
          setWritebackAttachmentFileName: updateWritebackAttachmentFileName,
          writebackAttachmentContentType,
          setWritebackAttachmentContentType: updateWritebackAttachmentContentType,
          writebackAttachmentSizeBytes,
          setWritebackAttachmentSizeBytes: updateWritebackAttachmentSizeBytes,
          writebackRefinementStatus,
          writebackRefinementMessage,
          writebackRefinementResult,
          draftInputs,
          setDraftInputs,
          selectedKnowledgeSourceIds,
          setSelectedKnowledgeSourceIds,
          includeLatestExtraction,
          setIncludeLatestExtraction,
          userConfirmedNote,
          setUserConfirmedNote,
          latestExtractionResult,
          setLatestExtractionResult,
          onFetchStoryDetail: fetchStoryDetail,
          onAnalyzeStory: analyzeStory,
          onRequestAiAssist: requestAiAssist,
          onGenerateDraftCases: generateDraftCases,
          onRequestDraftRefinement: requestDraftCaseRefinement,
          onValidateReviewDecisions: validateReviewDecisions,
          onPreviewTestPlansReadiness: previewAzureTestPlansReadiness,
          onSelectedTestPlansCandidateIdsChange: updateSelectedTestPlansCandidateIds,
          onTestPlansCreationConfirmedChange: setTestPlansCreationConfirmed,
          onCreateSelectedTestPlansCases: createSelectedAzureTestPlansCases,
          onMapAutomationCandidates: mapReviewedAutomationCandidates,
          onRequestAutomationRefinement: requestAutomationRefinement,
          onGenerateReviewExport: generateReviewExportPackage,
          onPreviewWritebackHelper: previewSelectedWritebackHelper,
          onRequestWritebackRefinement: requestWritebackRefinement,
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
  storyAnalysisStatus: StoryAnalysisStatus;
  storyAnalysisMessage: string;
  storyAnalysis: StoryRequirementAnalysis | null;
  llmProviderStatus: LlmProviderConfigurationSummary | null;
  llmProviderMessage: string;
  aiAssistStatus: AiAssistStatus;
  aiAssistMessage: string;
  aiAssistResult: StoryAnalysisAssistResult | null;
  draftStatus: DraftGenerationStatus;
  draftMessage: string;
  draftResult: TestCaseDraftGenerationResult | null;
  draftRefinementStatus: AiAssistStatus;
  draftRefinementMessage: string;
  draftRefinementResult: AiRefinementResult | null;
  reviewCases: ReviewedTestCase[];
  setReviewCases: (reviewCases: ReviewedTestCase[]) => void;
  reviewStatus: ReviewStatus;
  reviewMessage: string;
  reviewSession: TestCaseReviewSession | null;
  testPlansReadinessStatus: TestPlansReadinessStatus;
  testPlansReadinessMessage: string;
  testPlansReadiness: TestPlansReadinessResult | null;
  selectedTestPlansCandidateIds: string[];
  testPlansCreationConfirmed: boolean;
  testPlansCreationStatus: TestPlansCreationRequestStatus;
  testPlansCreationMessage: string;
  testPlansCreationResult: TestPlansCreationResult | null;
  automationMappingStatus: AutomationMappingStatus;
  automationMappingMessage: string;
  automationMappingResult: AutomationCandidateMappingResult | null;
  automationMappingOptions: Required<AutomationMappingOptions>;
  setAutomationMappingOptions: (options: Required<AutomationMappingOptions>) => void;
  automationRefinementStatus: AiAssistStatus;
  automationRefinementMessage: string;
  automationRefinementResult: AiRefinementResult | null;
  reviewExportStatus: ReviewExportStatus;
  reviewExportMessage: string;
  reviewExportResult: ReviewExportResult | null;
  reviewExportFormat: ReviewExportFormat;
  setReviewExportFormat: (format: ReviewExportFormat) => void;
  reviewExportSections: ReviewExportSection[];
  setReviewExportSections: (sections: ReviewExportSection[]) => void;
  writebackPreviewStatus: WritebackPreviewRequestStatus;
  writebackPreviewMessage: string;
  writebackPreviewResult: WritebackPreviewResult | null;
  writebackHelperType: WritebackHelperType;
  setWritebackHelperType: (helperType: WritebackHelperType) => void;
  writebackUserNotes: string;
  setWritebackUserNotes: (notes: string) => void;
  writebackTargetState: string;
  setWritebackTargetState: (targetState: string) => void;
  writebackAttachmentFileName: string;
  setWritebackAttachmentFileName: (fileName: string) => void;
  writebackAttachmentContentType: string;
  setWritebackAttachmentContentType: (contentType: string) => void;
  writebackAttachmentSizeBytes: string;
  setWritebackAttachmentSizeBytes: (sizeBytes: string) => void;
  writebackRefinementStatus: AiAssistStatus;
  writebackRefinementMessage: string;
  writebackRefinementResult: AiRefinementResult | null;
  draftInputs: Required<TestCaseDraftSelectedInputs>;
  setDraftInputs: (inputs: Required<TestCaseDraftSelectedInputs>) => void;
  selectedKnowledgeSourceIds: string[];
  setSelectedKnowledgeSourceIds: (sourceIds: string[]) => void;
  includeLatestExtraction: boolean;
  setIncludeLatestExtraction: (include: boolean) => void;
  userConfirmedNote: string;
  setUserConfirmedNote: (note: string) => void;
  latestExtractionResult: KnowledgeExtractionResult | null;
  setLatestExtractionResult: (result: KnowledgeExtractionResult | null) => void;
  onFetchStoryDetail: () => void;
  onAnalyzeStory: () => void;
  onRequestAiAssist: () => void;
  onGenerateDraftCases: () => void;
  onRequestDraftRefinement: () => void;
  onValidateReviewDecisions: () => void;
  onPreviewTestPlansReadiness: () => void;
  onSelectedTestPlansCandidateIdsChange: (candidateIds: string[]) => void;
  onTestPlansCreationConfirmedChange: (confirmed: boolean) => void;
  onCreateSelectedTestPlansCases: () => void;
  onMapAutomationCandidates: () => void;
  onRequestAutomationRefinement: () => void;
  onGenerateReviewExport: () => void;
  onPreviewWritebackHelper: () => void;
  onRequestWritebackRefinement: () => void;
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
          analysis={props.storyAnalysis}
          analysisStatus={props.storyAnalysisStatus}
          analysisMessage={props.storyAnalysisMessage}
          llmProviderStatus={props.llmProviderStatus}
          aiAssistStatus={props.aiAssistStatus}
          aiAssistMessage={props.aiAssistMessage}
          aiAssistResult={props.aiAssistResult}
          draftStatus={props.draftStatus}
          draftMessage={props.draftMessage}
          draftResult={props.draftResult}
          draftRefinementStatus={props.draftRefinementStatus}
          draftRefinementMessage={props.draftRefinementMessage}
          draftRefinementResult={props.draftRefinementResult}
          reviewCases={props.reviewCases}
          setReviewCases={props.setReviewCases}
          reviewStatus={props.reviewStatus}
          reviewMessage={props.reviewMessage}
          reviewSession={props.reviewSession}
          testPlansReadinessStatus={props.testPlansReadinessStatus}
          testPlansReadinessMessage={props.testPlansReadinessMessage}
          testPlansReadiness={props.testPlansReadiness}
          selectedTestPlansCandidateIds={props.selectedTestPlansCandidateIds}
          testPlansCreationConfirmed={props.testPlansCreationConfirmed}
          testPlansCreationStatus={props.testPlansCreationStatus}
          testPlansCreationMessage={props.testPlansCreationMessage}
          testPlansCreationResult={props.testPlansCreationResult}
          automationMappingStatus={props.automationMappingStatus}
          automationMappingMessage={props.automationMappingMessage}
          automationMappingResult={props.automationMappingResult}
          automationMappingOptions={props.automationMappingOptions}
          setAutomationMappingOptions={props.setAutomationMappingOptions}
          automationRefinementStatus={props.automationRefinementStatus}
          automationRefinementMessage={props.automationRefinementMessage}
          automationRefinementResult={props.automationRefinementResult}
          reviewExportStatus={props.reviewExportStatus}
          reviewExportMessage={props.reviewExportMessage}
          reviewExportResult={props.reviewExportResult}
          reviewExportFormat={props.reviewExportFormat}
          setReviewExportFormat={props.setReviewExportFormat}
          reviewExportSections={props.reviewExportSections}
          setReviewExportSections={props.setReviewExportSections}
          writebackPreviewStatus={props.writebackPreviewStatus}
          writebackPreviewMessage={props.writebackPreviewMessage}
          writebackPreviewResult={props.writebackPreviewResult}
          writebackHelperType={props.writebackHelperType}
          setWritebackHelperType={props.setWritebackHelperType}
          writebackUserNotes={props.writebackUserNotes}
          setWritebackUserNotes={props.setWritebackUserNotes}
          writebackTargetState={props.writebackTargetState}
          setWritebackTargetState={props.setWritebackTargetState}
          writebackAttachmentFileName={props.writebackAttachmentFileName}
          setWritebackAttachmentFileName={props.setWritebackAttachmentFileName}
          writebackAttachmentContentType={props.writebackAttachmentContentType}
          setWritebackAttachmentContentType={props.setWritebackAttachmentContentType}
          writebackAttachmentSizeBytes={props.writebackAttachmentSizeBytes}
          setWritebackAttachmentSizeBytes={props.setWritebackAttachmentSizeBytes}
          writebackRefinementStatus={props.writebackRefinementStatus}
          writebackRefinementMessage={props.writebackRefinementMessage}
          writebackRefinementResult={props.writebackRefinementResult}
          draftInputs={props.draftInputs}
          setDraftInputs={props.setDraftInputs}
          selectedKnowledgeSourceIds={props.selectedKnowledgeSourceIds}
          setSelectedKnowledgeSourceIds={props.setSelectedKnowledgeSourceIds}
          includeLatestExtraction={props.includeLatestExtraction}
          setIncludeLatestExtraction={props.setIncludeLatestExtraction}
          userConfirmedNote={props.userConfirmedNote}
          setUserConfirmedNote={props.setUserConfirmedNote}
          latestExtractionResult={props.latestExtractionResult}
          onFetchStoryDetail={props.onFetchStoryDetail}
          onAnalyzeStory={props.onAnalyzeStory}
          onRequestAiAssist={props.onRequestAiAssist}
          onGenerateDraftCases={props.onGenerateDraftCases}
          onRequestDraftRefinement={props.onRequestDraftRefinement}
          onValidateReviewDecisions={props.onValidateReviewDecisions}
          onPreviewTestPlansReadiness={props.onPreviewTestPlansReadiness}
          onSelectedTestPlansCandidateIdsChange={props.onSelectedTestPlansCandidateIdsChange}
          onTestPlansCreationConfirmedChange={props.onTestPlansCreationConfirmedChange}
          onCreateSelectedTestPlansCases={props.onCreateSelectedTestPlansCases}
          onMapAutomationCandidates={props.onMapAutomationCandidates}
          onRequestAutomationRefinement={props.onRequestAutomationRefinement}
          onGenerateReviewExport={props.onGenerateReviewExport}
          onPreviewWritebackHelper={props.onPreviewWritebackHelper}
          onRequestWritebackRefinement={props.onRequestWritebackRefinement}
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
          llmProviderStatus={props.llmProviderStatus}
          llmProviderMessage={props.llmProviderMessage}
          onSetupStatusChange={props.setSetupStatus}
          onSetupMessageChange={props.setSetupMessage}
          projectOptions={props.projectOptions}
          onProjectOptionsChange={props.setProjectOptions}
          teamOptions={props.teamOptions}
          onTeamOptionsChange={props.setTeamOptions}
          onLatestExtractionResult={props.setLatestExtractionResult}
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
  analysis,
  analysisStatus,
  analysisMessage,
  llmProviderStatus,
  aiAssistStatus,
  aiAssistMessage,
  aiAssistResult,
  draftStatus,
  draftMessage,
  draftResult,
  draftRefinementStatus,
  draftRefinementMessage,
  draftRefinementResult,
  reviewCases,
  setReviewCases,
  reviewStatus,
  reviewMessage,
  reviewSession,
  testPlansReadinessStatus,
  testPlansReadinessMessage,
  testPlansReadiness,
  selectedTestPlansCandidateIds,
  testPlansCreationConfirmed,
  testPlansCreationStatus,
  testPlansCreationMessage,
  testPlansCreationResult,
  automationMappingStatus,
  automationMappingMessage,
  automationMappingResult,
  automationMappingOptions,
  setAutomationMappingOptions,
  automationRefinementStatus,
  automationRefinementMessage,
  automationRefinementResult,
  reviewExportStatus,
  reviewExportMessage,
  reviewExportResult,
  reviewExportFormat,
  setReviewExportFormat,
  reviewExportSections,
  setReviewExportSections,
  writebackPreviewStatus,
  writebackPreviewMessage,
  writebackPreviewResult,
  writebackHelperType,
  setWritebackHelperType,
  writebackUserNotes,
  setWritebackUserNotes,
  writebackTargetState,
  setWritebackTargetState,
  writebackAttachmentFileName,
  setWritebackAttachmentFileName,
  writebackAttachmentContentType,
  setWritebackAttachmentContentType,
  writebackAttachmentSizeBytes,
  setWritebackAttachmentSizeBytes,
  writebackRefinementStatus,
  writebackRefinementMessage,
  writebackRefinementResult,
  draftInputs,
  setDraftInputs,
  selectedKnowledgeSourceIds,
  setSelectedKnowledgeSourceIds,
  includeLatestExtraction,
  setIncludeLatestExtraction,
  userConfirmedNote,
  setUserConfirmedNote,
  latestExtractionResult,
  onFetchStoryDetail,
  onAnalyzeStory,
  onRequestAiAssist,
  onGenerateDraftCases,
  onRequestDraftRefinement,
  onValidateReviewDecisions,
  onPreviewTestPlansReadiness,
  onSelectedTestPlansCandidateIdsChange,
  onTestPlansCreationConfirmedChange,
  onCreateSelectedTestPlansCases,
  onMapAutomationCandidates,
  onRequestAutomationRefinement,
  onGenerateReviewExport,
  onPreviewWritebackHelper,
  onRequestWritebackRefinement
}: {
  pageContext: AzureDevOpsPageContext | null;
  status: DetectionStatus;
  settings: ExtensionSettings;
  detail: WorkItemDetail | null;
  detailStatus: StoryDetailStatus;
  detailMessage: string;
  analysis: StoryRequirementAnalysis | null;
  analysisStatus: StoryAnalysisStatus;
  analysisMessage: string;
  llmProviderStatus: LlmProviderConfigurationSummary | null;
  aiAssistStatus: AiAssistStatus;
  aiAssistMessage: string;
  aiAssistResult: StoryAnalysisAssistResult | null;
  draftStatus: DraftGenerationStatus;
  draftMessage: string;
  draftResult: TestCaseDraftGenerationResult | null;
  draftRefinementStatus: AiAssistStatus;
  draftRefinementMessage: string;
  draftRefinementResult: AiRefinementResult | null;
  reviewCases: ReviewedTestCase[];
  setReviewCases: (reviewCases: ReviewedTestCase[]) => void;
  reviewStatus: ReviewStatus;
  reviewMessage: string;
  reviewSession: TestCaseReviewSession | null;
  testPlansReadinessStatus: TestPlansReadinessStatus;
  testPlansReadinessMessage: string;
  testPlansReadiness: TestPlansReadinessResult | null;
  selectedTestPlansCandidateIds: string[];
  testPlansCreationConfirmed: boolean;
  testPlansCreationStatus: TestPlansCreationRequestStatus;
  testPlansCreationMessage: string;
  testPlansCreationResult: TestPlansCreationResult | null;
  automationMappingStatus: AutomationMappingStatus;
  automationMappingMessage: string;
  automationMappingResult: AutomationCandidateMappingResult | null;
  automationMappingOptions: Required<AutomationMappingOptions>;
  setAutomationMappingOptions: (options: Required<AutomationMappingOptions>) => void;
  automationRefinementStatus: AiAssistStatus;
  automationRefinementMessage: string;
  automationRefinementResult: AiRefinementResult | null;
  reviewExportStatus: ReviewExportStatus;
  reviewExportMessage: string;
  reviewExportResult: ReviewExportResult | null;
  reviewExportFormat: ReviewExportFormat;
  setReviewExportFormat: (format: ReviewExportFormat) => void;
  reviewExportSections: ReviewExportSection[];
  setReviewExportSections: (sections: ReviewExportSection[]) => void;
  writebackPreviewStatus: WritebackPreviewRequestStatus;
  writebackPreviewMessage: string;
  writebackPreviewResult: WritebackPreviewResult | null;
  writebackHelperType: WritebackHelperType;
  setWritebackHelperType: (helperType: WritebackHelperType) => void;
  writebackUserNotes: string;
  setWritebackUserNotes: (notes: string) => void;
  writebackTargetState: string;
  setWritebackTargetState: (targetState: string) => void;
  writebackAttachmentFileName: string;
  setWritebackAttachmentFileName: (fileName: string) => void;
  writebackAttachmentContentType: string;
  setWritebackAttachmentContentType: (contentType: string) => void;
  writebackAttachmentSizeBytes: string;
  setWritebackAttachmentSizeBytes: (sizeBytes: string) => void;
  writebackRefinementStatus: AiAssistStatus;
  writebackRefinementMessage: string;
  writebackRefinementResult: AiRefinementResult | null;
  draftInputs: Required<TestCaseDraftSelectedInputs>;
  setDraftInputs: (inputs: Required<TestCaseDraftSelectedInputs>) => void;
  selectedKnowledgeSourceIds: string[];
  setSelectedKnowledgeSourceIds: (sourceIds: string[]) => void;
  includeLatestExtraction: boolean;
  setIncludeLatestExtraction: (include: boolean) => void;
  userConfirmedNote: string;
  setUserConfirmedNote: (note: string) => void;
  latestExtractionResult: KnowledgeExtractionResult | null;
  onFetchStoryDetail: () => void;
  onAnalyzeStory: () => void;
  onRequestAiAssist: () => void;
  onGenerateDraftCases: () => void;
  onRequestDraftRefinement: () => void;
  onValidateReviewDecisions: () => void;
  onPreviewTestPlansReadiness: () => void;
  onSelectedTestPlansCandidateIdsChange: (candidateIds: string[]) => void;
  onTestPlansCreationConfirmedChange: (confirmed: boolean) => void;
  onCreateSelectedTestPlansCases: () => void;
  onMapAutomationCandidates: () => void;
  onRequestAutomationRefinement: () => void;
  onGenerateReviewExport: () => void;
  onPreviewWritebackHelper: () => void;
  onRequestWritebackRefinement: () => void;
}) {
  const detected = Boolean(pageContext);
  const checking = status === "checking";
  const differsFromSelectedBoard =
    detected &&
    settings.project.trim() &&
    settings.project.trim().toLowerCase() !== pageContext?.project.toLowerCase();
  const selectedBoard = hasSelectedTeamBoard(settings) ? buildBoardScope(settings) : null;
  const scopedSources = selectedBoard
    ? settings.boardKnowledgeSources.filter((source) => isSameBoardKnowledgeScope(source, selectedBoard))
    : [];
  const canLinkKnowledge = Boolean(selectedBoard) && !differsFromSelectedBoard;

  return (
    <section className="panel-content">
      <PanelIntro eyebrow="Story" title={detected ? "Review this Azure work item." : checking ? "Checking current page." : "Open a story to begin."} />
      {detected ? (
        <PrimaryAction
          label={detailStatus === "loading" ? "Fetching details..." : "Fetch story details"}
          helper="Read-only via QA Assist API"
          disabled={detailStatus === "loading"}
          onClick={onFetchStoryDetail}
        />
      ) : null}
      <DetectionCard pageContext={pageContext} status={status} />
      {!detected && !checking ? <OpenAzureWorkItemInstruction /> : null}
      {detected && !hasSelectedTeamBoard(settings) ? (
        <InfoCard title="Page context" body="Using detected page context. Select a team board in Settings for Today/recommendations." />
      ) : null}
      {differsFromSelectedBoard ? (
        <InfoCard title="Board mismatch" body="This work item page differs from the selected team board. Review before using board-level recommendations." tone="warning" />
      ) : null}
      <InfoCard title="Fetch status" body={detailMessage} tone={detailStatus === "error" ? "warning" : "neutral"} />
      {detail ? (
        <>
          <StoryDetailView detail={detail} />
          <StoryLinkedKnowledgeCard
            settings={settings}
            sources={scopedSources}
            canLinkKnowledge={canLinkKnowledge}
            differsFromSelectedBoard={Boolean(differsFromSelectedBoard)}
            selectedKnowledgeSourceIds={selectedKnowledgeSourceIds}
            onSelectedKnowledgeSourceIdsChange={setSelectedKnowledgeSourceIds}
            latestExtractionResult={latestExtractionResult}
            includeLatestExtraction={includeLatestExtraction}
            onIncludeLatestExtractionChange={setIncludeLatestExtraction}
            userConfirmedNote={userConfirmedNote}
            onUserConfirmedNoteChange={setUserConfirmedNote}
          />
          <StoryAnalysisCard
            analysis={analysis}
            status={analysisStatus}
            message={analysisMessage}
            canAnalyze={Boolean(detail)}
            llmProviderStatus={llmProviderStatus}
            aiAssistStatus={aiAssistStatus}
            aiAssistMessage={aiAssistMessage}
            aiAssistResult={aiAssistResult}
            onAnalyze={onAnalyzeStory}
            onRequestAiAssist={onRequestAiAssist}
          />
          <TestCaseDraftCard
            analysis={analysis}
            status={draftStatus}
            message={draftMessage}
            result={draftResult}
            refinementStatus={draftRefinementStatus}
            refinementMessage={draftRefinementMessage}
            refinementResult={draftRefinementResult}
            llmProviderStatus={llmProviderStatus}
            reviewCases={reviewCases}
            onReviewCasesChange={setReviewCases}
            reviewStatus={reviewStatus}
            reviewMessage={reviewMessage}
            reviewSession={reviewSession}
            testPlansReadinessStatus={testPlansReadinessStatus}
            testPlansReadinessMessage={testPlansReadinessMessage}
            testPlansReadiness={testPlansReadiness}
            selectedTestPlansCandidateIds={selectedTestPlansCandidateIds}
            testPlansCreationConfirmed={testPlansCreationConfirmed}
            testPlansCreationStatus={testPlansCreationStatus}
            testPlansCreationMessage={testPlansCreationMessage}
            testPlansCreationResult={testPlansCreationResult}
            automationMappingStatus={automationMappingStatus}
            automationMappingMessage={automationMappingMessage}
            automationMappingResult={automationMappingResult}
            automationMappingOptions={automationMappingOptions}
            onAutomationMappingOptionsChange={setAutomationMappingOptions}
            automationRefinementStatus={automationRefinementStatus}
            automationRefinementMessage={automationRefinementMessage}
            automationRefinementResult={automationRefinementResult}
            inputs={draftInputs}
            onInputsChange={setDraftInputs}
            onGenerate={onGenerateDraftCases}
            onRequestDraftRefinement={onRequestDraftRefinement}
            onValidateReviewDecisions={onValidateReviewDecisions}
            onPreviewTestPlansReadiness={onPreviewTestPlansReadiness}
            onSelectedTestPlansCandidateIdsChange={onSelectedTestPlansCandidateIdsChange}
            onTestPlansCreationConfirmedChange={onTestPlansCreationConfirmedChange}
            onCreateSelectedTestPlansCases={onCreateSelectedTestPlansCases}
            onMapAutomationCandidates={onMapAutomationCandidates}
            onRequestAutomationRefinement={onRequestAutomationRefinement}
          />
          <ReviewExportCard
            status={reviewExportStatus}
            message={reviewExportMessage}
            result={reviewExportResult}
            format={reviewExportFormat}
            selectedSections={reviewExportSections}
            onFormatChange={setReviewExportFormat}
            onSelectedSectionsChange={setReviewExportSections}
            canExport={hasExportableStoryData({
              workItemDetail: detail,
              storyAnalysis: analysis,
              aiAssistResult,
              draftResult,
              reviewSession,
              testPlansReadiness,
              testPlansCreationResult,
              automationMappingResult
            })}
            onGenerate={onGenerateReviewExport}
          />
          <WritebackHelperCard
            status={writebackPreviewStatus}
            message={writebackPreviewMessage}
            result={writebackPreviewResult}
            helperType={writebackHelperType}
            userNotes={writebackUserNotes}
            targetState={writebackTargetState}
            attachmentFileName={writebackAttachmentFileName}
            attachmentContentType={writebackAttachmentContentType}
            attachmentSizeBytes={writebackAttachmentSizeBytes}
            refinementStatus={writebackRefinementStatus}
            refinementMessage={writebackRefinementMessage}
            refinementResult={writebackRefinementResult}
            llmProviderStatus={llmProviderStatus}
            canPreview={hasExportableStoryData({
              workItemDetail: detail,
              storyAnalysis: analysis,
              aiAssistResult,
              draftResult,
              reviewSession,
              testPlansReadiness,
              testPlansCreationResult,
              automationMappingResult
            })}
            onHelperTypeChange={setWritebackHelperType}
            onUserNotesChange={setWritebackUserNotes}
            onTargetStateChange={setWritebackTargetState}
            onAttachmentFileNameChange={setWritebackAttachmentFileName}
            onAttachmentContentTypeChange={setWritebackAttachmentContentType}
            onAttachmentSizeBytesChange={setWritebackAttachmentSizeBytes}
            onPreview={onPreviewWritebackHelper}
            onRequestRefinement={onRequestWritebackRefinement}
          />
        </>
      ) : <StoryPlaceholderCards />}
    </section>
  );
}

function OpenAzureWorkItemInstruction() {
  return (
    <article className="info-card">
      <h3>Open an Azure DevOps work item</h3>
      <p>Go to an Azure DevOps work item page, then reopen QA Assist or switch back to the Story tab.</p>
      <div className="url-examples" aria-label="Supported Azure DevOps work item URL examples">
        <code>https://dev.azure.com/{`{org}`}/{`{project}`}/_workitems/edit/{`{id}`}</code>
        <code>https://{`{org}`}.visualstudio.com/{`{project}`}/_workitems/edit/{`{id}`}</code>
      </div>
    </article>
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
      <TrustNote text="Description and acceptance criteria are evidence. Requirement analysis is a separate evidence-bound preview and final test cases are not generated yet." />
    </>
  );
}

function StoryLinkedKnowledgeCard({
  settings,
  sources,
  canLinkKnowledge,
  differsFromSelectedBoard,
  selectedKnowledgeSourceIds,
  onSelectedKnowledgeSourceIdsChange,
  latestExtractionResult,
  includeLatestExtraction,
  onIncludeLatestExtractionChange,
  userConfirmedNote,
  onUserConfirmedNoteChange
}: {
  settings: ExtensionSettings;
  sources: BoardKnowledgeSource[];
  canLinkKnowledge: boolean;
  differsFromSelectedBoard: boolean;
  selectedKnowledgeSourceIds: string[];
  onSelectedKnowledgeSourceIdsChange: (sourceIds: string[]) => void;
  latestExtractionResult: KnowledgeExtractionResult | null;
  includeLatestExtraction: boolean;
  onIncludeLatestExtractionChange: (include: boolean) => void;
  userConfirmedNote: string;
  onUserConfirmedNoteChange: (note: string) => void;
}) {
  const selectedCount = selectedKnowledgeSourceIds.length + (includeLatestExtraction && latestExtractionResult?.evidence ? 1 : 0) + (userConfirmedNote.trim() ? 1 : 0);

  function toggleSource(sourceId: string): void {
    onSelectedKnowledgeSourceIdsChange(
      selectedKnowledgeSourceIds.includes(sourceId)
        ? selectedKnowledgeSourceIds.filter((id) => id !== sourceId)
        : [...selectedKnowledgeSourceIds, sourceId]
    );
  }

  return (
    <article className="info-card linked-evidence-card">
      <div className="card-row">
        <h3>Linked knowledge evidence</h3>
        <span className="status-pill">{selectedCount} selected</span>
      </div>
      <p>Only selected evidence will be included. Nothing is automatically linked.</p>
      {!hasSelectedTeamBoard(settings) ? (
        <InfoCard title="Team board needed" body="Select a team board to link board knowledge evidence." tone="warning" />
      ) : null}
      {differsFromSelectedBoard ? (
        <InfoCard title="Board mismatch" body="This story page differs from the selected team board. Board knowledge is not auto-linked." tone="warning" />
      ) : null}
      {canLinkKnowledge && sources.length > 0 ? (
        <div className="choice-list">
          {sources.map((source) => (
            <label key={source.id} className="choice-row">
              <input
                type="checkbox"
                checked={selectedKnowledgeSourceIds.includes(source.id)}
                onChange={() => toggleSource(source.id)}
              />
              <span>
                <strong>{source.title}</strong>
                <small>{formatSourceType(source.type)} | {source.status}. Metadata-only context.</small>
              </span>
            </label>
          ))}
        </div>
      ) : canLinkKnowledge ? (
        <InfoCard title="Board knowledge" body="No metadata-only sources are configured for this selected team board." />
      ) : null}
      {latestExtractionResult?.evidence && latestExtractionResult.extractedText ? (
        <label className="choice-row">
          <input
            type="checkbox"
            checked={includeLatestExtraction}
            disabled={!canLinkKnowledge}
            onChange={(event) => onIncludeLatestExtractionChange(event.target.checked)}
          />
          <span>
            <strong>Latest extraction preview</strong>
            <small>{latestExtractionResult.evidence.fileName}. Capped preview only; full document is not included.</small>
          </span>
        </label>
      ) : (
        <InfoCard title="Extraction preview" body="Run an extraction preview in Settings to make the latest capped preview selectable here." />
      )}
      <TextAreaInput
        label="User-confirmed note optional"
        help="Use only a short note you confirm applies to this story. It is sent with this analysis request only."
        placeholder="Example: BA confirmed validation should apply to all required fields."
        value={userConfirmedNote}
        onChange={onUserConfirmedNoteChange}
      />
    </article>
  );
}

function StoryAnalysisCard({
  analysis,
  status,
  message,
  canAnalyze,
  llmProviderStatus,
  aiAssistStatus,
  aiAssistMessage,
  aiAssistResult,
  onAnalyze,
  onRequestAiAssist
}: {
  analysis: StoryRequirementAnalysis | null;
  status: StoryAnalysisStatus;
  message: string;
  canAnalyze: boolean;
  llmProviderStatus: LlmProviderConfigurationSummary | null;
  aiAssistStatus: AiAssistStatus;
  aiAssistMessage: string;
  aiAssistResult: StoryAnalysisAssistResult | null;
  onAnalyze: () => void;
  onRequestAiAssist: () => void;
}) {
  const providerAvailable = llmProviderStatus?.availability === "available";

  return (
    <article className="info-card analysis-card">
      <div className="card-row">
        <h3>Requirement analysis</h3>
        <span className="status-pill">{analysis ? "Evidence-bound preview" : "Not analyzed"}</span>
      </div>
      <p>{message}</p>
      <SecondaryAction
        label={status === "loading" ? "Analyzing requirements..." : "Analyze requirements"}
        disabled={!canAnalyze || status === "loading"}
        onClick={onAnalyze}
      />
      {analysis ? (
        <>
          <StoryAnalysisResult analysis={analysis} />
          <article className="info-card ai-assist-card">
            <div className="card-row">
              <h3>AI-assisted suggestions</h3>
              <span className={providerAvailable ? "status-pill success" : "status-pill"}>
                {llmProviderStatus?.availability ?? "unknown"}
              </span>
            </div>
            <p>{aiAssistMessage}</p>
            <SecondaryAction
              label={aiAssistStatus === "loading" ? "Requesting AI assist..." : "Request AI assist"}
              disabled={!analysis || aiAssistStatus === "loading" || !providerAvailable}
              onClick={onRequestAiAssist}
            />
            {!providerAvailable ? (
              <p className="trust-note">{llmProviderStatus?.reason ?? "AI provider is disabled or misconfigured on the backend. Deterministic mode remains available."}</p>
            ) : null}
            {aiAssistResult ? <AiAssistResultView result={aiAssistResult} /> : null}
          </article>
        </>
      ) : <p className="analysis-empty">Fetch story details first. Test case draft not generated yet.</p>}
    </article>
  );
}

function AiAssistResultView({ result }: { result: StoryAnalysisAssistResult }) {
  return (
    <div className="analysis-body">
      <InfoGrid
        items={[
          ["Mode", result.mode],
          ["Provider", result.provider.provider],
          ["Model", result.provider.model ?? "Not returned"],
          ["Generated", formatDateTime(result.generatedAt)]
        ]}
      />
      <AnalysisList title="Summary suggestion" items={[`${result.suggestedRequirementSummary.text} (${result.suggestedRequirementSummary.certainty})`]} />
      <AnalysisList title="Suggested gaps/questions" items={result.suggestedGapsOrQuestions.map(formatAssistSuggestion)} />
      <AnalysisList title="Suggested likely test areas" items={result.suggestedLikelyTestAreas.map(formatAssistSuggestion)} />
      <AnalysisList title="AI warnings" items={result.warnings} />
      <p className="trust-note">{result.disclaimer}</p>
    </div>
  );
}

function AiRefinementCard({
  title,
  status,
  message,
  result,
  llmProviderStatus,
  canRequest,
  loadingLabel,
  actionLabel,
  onRequest
}: {
  title: string;
  status: AiAssistStatus;
  message: string;
  result: AiRefinementResult | null;
  llmProviderStatus: LlmProviderConfigurationSummary | null;
  canRequest: boolean;
  loadingLabel: string;
  actionLabel: string;
  onRequest: () => void;
}) {
  const providerAvailable = llmProviderStatus?.availability === "available";

  return (
    <article className="info-card ai-assist-card">
      <div className="card-row">
        <h4>{title}</h4>
        <span className={providerAvailable ? "status-pill success" : "status-pill"}>
          {llmProviderStatus?.availability ?? "unknown"}
        </span>
      </div>
      <p>{message}</p>
      <SecondaryAction
        label={status === "loading" ? loadingLabel : actionLabel}
        disabled={!canRequest || status === "loading" || !providerAvailable}
        onClick={onRequest}
      />
      {!providerAvailable ? (
        <p className="trust-note">{llmProviderStatus?.reason ?? "AI provider is disabled or misconfigured on the backend. Deterministic output remains available."}</p>
      ) : null}
      {result ? <AiRefinementResultView result={result} /> : null}
    </article>
  );
}

function AiRefinementResultView({ result }: { result: AiRefinementResult }) {
  return (
    <div className="analysis-body">
      <InfoGrid
        items={[
          ["Mode", result.mode],
          ["Target", result.target],
          ["Provider", result.providerSummary.provider],
          ["Model", result.providerSummary.model ?? "Not returned"],
          ["Generated", formatDateTime(result.generatedAt)]
        ]}
      />
      {result.sections.map((section) => (
        <div className="analysis-list" key={`${result.target}-${section.title}`}>
          <span>{section.title}</span>
          <p>{section.summary}</p>
          <BriefingList title="Suggestions" items={section.bullets} />
          <BriefingList title="Suggested edits" items={section.suggestedEdits.map((edit) => `${edit.field}: ${edit.suggestion}${edit.reason ? ` (${edit.reason})` : ""}`)} />
          <BriefingList title="Confidence notes" items={section.confidenceNotes} />
        </div>
      ))}
      <AnalysisList title="AI refinement warnings" items={result.warnings.map((warning) => `${warning.code}: ${warning.message}`)} />
      <p className="trust-note">{result.disclaimer}</p>
      <p className="trust-note">Apply suggestion manually only after QA review. No deterministic result or external system is updated by this output.</p>
    </div>
  );
}

function StoryAnalysisResult({ analysis }: { analysis: StoryRequirementAnalysis }) {
  return (
    <div className="analysis-body">
      <strong>{analysis.headline}</strong>
      <p>{analysis.requirementSummary.text}</p>
      <InfoGrid
        items={[
          ["Acceptance criteria", analysis.acceptanceCriteriaStatus],
          ["Description", analysis.descriptionStatus],
          ["Confidence", analysis.confidence],
          ["Work item evidence", String(analysis.evidenceCoverage.workItemEvidenceCount)],
          ["Linked knowledge", String(analysis.evidenceCoverage.linkedKnowledgeEvidenceCount)]
        ]}
      />
      <AnalysisList title="Evidence coverage warnings" items={analysis.evidenceCoverage.warnings} />
      <AnalysisList title="Linked knowledge evidence" items={analysis.linkedKnowledgeEvidence.map(formatLinkedEvidenceItem)} />
      <AnalysisList title="Gaps" items={analysis.gaps.map(formatAnalysisItem)} />
      <AnalysisList title="Questions for BA/PO" items={analysis.questionsForBAOrPO.map(formatAnalysisItem)} />
      <AnalysisList title="Likely test areas" items={analysis.likelyTestAreas.map((area) => `${area.name}: ${area.reason}`)} />
      <AnalysisList title="Risks" items={analysis.risks.map(formatAnalysisItem)} />
      <AnalysisList title="Assumptions" items={analysis.assumptions.slice(0, 4)} />
      <AnalysisList title="Needs confirmation" items={analysis.needsConfirmation.slice(0, 5)} />
      <p className="trust-note">{analysis.disclaimer}</p>
      <p className="trust-note">Linked board knowledge is user-selected context only. Metadata-only and extracted preview evidence are not complete or authoritative.</p>
      <p className="analysis-empty">Test case draft not generated yet.</p>
    </div>
  );
}

function TestCaseDraftCard({
  analysis,
  status,
  message,
  result,
  refinementStatus,
  refinementMessage,
  refinementResult,
  llmProviderStatus,
  reviewCases,
  onReviewCasesChange,
  reviewStatus,
  reviewMessage,
  reviewSession,
  testPlansReadinessStatus,
  testPlansReadinessMessage,
  testPlansReadiness,
  selectedTestPlansCandidateIds,
  testPlansCreationConfirmed,
  testPlansCreationStatus,
  testPlansCreationMessage,
  testPlansCreationResult,
  automationMappingStatus,
  automationMappingMessage,
  automationMappingResult,
  automationMappingOptions,
  onAutomationMappingOptionsChange,
  automationRefinementStatus,
  automationRefinementMessage,
  automationRefinementResult,
  inputs,
  onInputsChange,
  onGenerate,
  onRequestDraftRefinement,
  onValidateReviewDecisions,
  onPreviewTestPlansReadiness,
  onSelectedTestPlansCandidateIdsChange,
  onTestPlansCreationConfirmedChange,
  onCreateSelectedTestPlansCases,
  onMapAutomationCandidates,
  onRequestAutomationRefinement
}: {
  analysis: StoryRequirementAnalysis | null;
  status: DraftGenerationStatus;
  message: string;
  result: TestCaseDraftGenerationResult | null;
  refinementStatus: AiAssistStatus;
  refinementMessage: string;
  refinementResult: AiRefinementResult | null;
  llmProviderStatus: LlmProviderConfigurationSummary | null;
  reviewCases: ReviewedTestCase[];
  onReviewCasesChange: (reviewCases: ReviewedTestCase[]) => void;
  reviewStatus: ReviewStatus;
  reviewMessage: string;
  reviewSession: TestCaseReviewSession | null;
  testPlansReadinessStatus: TestPlansReadinessStatus;
  testPlansReadinessMessage: string;
  testPlansReadiness: TestPlansReadinessResult | null;
  selectedTestPlansCandidateIds: string[];
  testPlansCreationConfirmed: boolean;
  testPlansCreationStatus: TestPlansCreationRequestStatus;
  testPlansCreationMessage: string;
  testPlansCreationResult: TestPlansCreationResult | null;
  automationMappingStatus: AutomationMappingStatus;
  automationMappingMessage: string;
  automationMappingResult: AutomationCandidateMappingResult | null;
  automationMappingOptions: Required<AutomationMappingOptions>;
  onAutomationMappingOptionsChange: (options: Required<AutomationMappingOptions>) => void;
  automationRefinementStatus: AiAssistStatus;
  automationRefinementMessage: string;
  automationRefinementResult: AiRefinementResult | null;
  inputs: Required<TestCaseDraftSelectedInputs>;
  onInputsChange: (inputs: Required<TestCaseDraftSelectedInputs>) => void;
  onGenerate: () => void;
  onRequestDraftRefinement: () => void;
  onValidateReviewDecisions: () => void;
  onPreviewTestPlansReadiness: () => void;
  onSelectedTestPlansCandidateIdsChange: (candidateIds: string[]) => void;
  onTestPlansCreationConfirmedChange: (confirmed: boolean) => void;
  onCreateSelectedTestPlansCases: () => void;
  onMapAutomationCandidates: () => void;
  onRequestAutomationRefinement: () => void;
}) {
  function toggleInput(key: keyof Required<TestCaseDraftSelectedInputs>): void {
    onInputsChange({ ...inputs, [key]: !inputs[key] });
  }

  return (
    <article className="info-card draft-card">
      <div className="card-row">
        <h3>Draft test cases</h3>
        <span className="status-pill">Draft only</span>
      </div>
      <p>{message}</p>
      <div className="choice-list compact">
        <DraftOption label="Include positive path" checked={inputs.includePositivePath} onChange={() => toggleInput("includePositivePath")} />
        <DraftOption label="Include negative path" checked={inputs.includeNegativePath} onChange={() => toggleInput("includeNegativePath")} />
        <DraftOption label="Include regression" checked={inputs.includeRegression} onChange={() => toggleInput("includeRegression")} />
        <DraftOption label="Include linked knowledge" checked={inputs.includeLinkedKnowledge} onChange={() => toggleInput("includeLinkedKnowledge")} />
      </div>
      <SecondaryAction
        label={status === "loading" ? "Generating draft cases..." : "Generate draft cases"}
        disabled={!analysis || status === "loading"}
        onClick={onGenerate}
      />
      {!analysis ? <p className="analysis-empty">Analyze requirements before drafting test cases.</p> : null}
      {result ? (
        <>
          <AiRefinementCard
            title="AI-assisted draft case refinements"
            status={refinementStatus}
            message={refinementMessage}
            result={refinementResult}
            llmProviderStatus={llmProviderStatus}
            canRequest={Boolean(result)}
            loadingLabel="Requesting draft refinements..."
            actionLabel="Request AI refinement for draft cases"
            onRequest={onRequestDraftRefinement}
          />
          <TestCaseDraftResult
            result={result}
            reviewCases={reviewCases}
            onReviewCasesChange={onReviewCasesChange}
            reviewStatus={reviewStatus}
            reviewMessage={reviewMessage}
            reviewSession={reviewSession}
            onValidateReviewDecisions={onValidateReviewDecisions}
            readinessStatus={testPlansReadinessStatus}
            readinessMessage={testPlansReadinessMessage}
            readiness={testPlansReadiness}
            onPreviewReadiness={onPreviewTestPlansReadiness}
            selectedCandidateIds={selectedTestPlansCandidateIds}
            creationConfirmed={testPlansCreationConfirmed}
            creationStatus={testPlansCreationStatus}
            creationMessage={testPlansCreationMessage}
            creationResult={testPlansCreationResult}
            onSelectedCandidateIdsChange={onSelectedTestPlansCandidateIdsChange}
            onCreationConfirmedChange={onTestPlansCreationConfirmedChange}
            onCreateSelected={onCreateSelectedTestPlansCases}
            automationMappingStatus={automationMappingStatus}
            automationMappingMessage={automationMappingMessage}
            automationMappingResult={automationMappingResult}
            automationMappingOptions={automationMappingOptions}
            onAutomationMappingOptionsChange={onAutomationMappingOptionsChange}
            automationRefinementStatus={automationRefinementStatus}
            automationRefinementMessage={automationRefinementMessage}
            automationRefinementResult={automationRefinementResult}
            llmProviderStatus={llmProviderStatus}
            onMapAutomationCandidates={onMapAutomationCandidates}
            onRequestAutomationRefinement={onRequestAutomationRefinement}
          />
        </>
      ) : null}
    </article>
  );
}

function DraftOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="choice-row compact">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>
        <strong>{label}</strong>
      </span>
    </label>
  );
}

function TestCaseDraftResult({
  result,
  reviewCases,
  onReviewCasesChange,
  reviewStatus,
  reviewMessage,
  reviewSession,
  onValidateReviewDecisions,
  readinessStatus,
  readinessMessage,
  readiness,
  onPreviewReadiness,
  selectedCandidateIds,
  creationConfirmed,
  creationStatus,
  creationMessage,
  creationResult,
  onSelectedCandidateIdsChange,
  onCreationConfirmedChange,
  onCreateSelected,
  automationMappingStatus,
  automationMappingMessage,
  automationMappingResult,
  automationMappingOptions,
  onAutomationMappingOptionsChange,
  automationRefinementStatus,
  automationRefinementMessage,
  automationRefinementResult,
  llmProviderStatus,
  onMapAutomationCandidates,
  onRequestAutomationRefinement
}: {
  result: TestCaseDraftGenerationResult;
  reviewCases: ReviewedTestCase[];
  onReviewCasesChange: (reviewCases: ReviewedTestCase[]) => void;
  reviewStatus: ReviewStatus;
  reviewMessage: string;
  reviewSession: TestCaseReviewSession | null;
  onValidateReviewDecisions: () => void;
  readinessStatus: TestPlansReadinessStatus;
  readinessMessage: string;
  readiness: TestPlansReadinessResult | null;
  onPreviewReadiness: () => void;
  selectedCandidateIds: string[];
  creationConfirmed: boolean;
  creationStatus: TestPlansCreationRequestStatus;
  creationMessage: string;
  creationResult: TestPlansCreationResult | null;
  onSelectedCandidateIdsChange: (candidateIds: string[]) => void;
  onCreationConfirmedChange: (confirmed: boolean) => void;
  onCreateSelected: () => void;
  automationMappingStatus: AutomationMappingStatus;
  automationMappingMessage: string;
  automationMappingResult: AutomationCandidateMappingResult | null;
  automationMappingOptions: Required<AutomationMappingOptions>;
  onAutomationMappingOptionsChange: (options: Required<AutomationMappingOptions>) => void;
  automationRefinementStatus: AiAssistStatus;
  automationRefinementMessage: string;
  automationRefinementResult: AiRefinementResult | null;
  llmProviderStatus: LlmProviderConfigurationSummary | null;
  onMapAutomationCandidates: () => void;
  onRequestAutomationRefinement: () => void;
}) {
  const summary = reviewSession?.summary ?? buildLocalReviewSummary(reviewCases, result.draftCases.length);

  function updateReviewCase(originalDraftId: string, updater: (reviewCase: ReviewedTestCase) => ReviewedTestCase): void {
    onReviewCasesChange(reviewCases.map((reviewCase) =>
      reviewCase.originalDraftId === originalDraftId ? updater(reviewCase) : reviewCase
    ));
  }

  return (
    <div className="draft-result">
      <InfoGrid
        items={[
          ["Coverage", result.coverageSummary],
          ["Draft count", String(result.draftCases.length)],
          ["Mode", result.mode],
          ["Status", result.blockedBy.length > 0 ? "Blocked by gaps" : "Needs QA review"]
        ]}
      />
      <AnalysisList title="Draft warnings" items={result.warnings.map((warning) => warning.message)} />
      <AnalysisList title="Needs confirmation" items={result.needsConfirmation.slice(0, 5)} />
      <article className="review-panel">
        <div className="card-row">
          <h4>Review workflow</h4>
          <span className={reviewStatus === "success" ? "status-pill success" : reviewStatus === "error" ? "status-pill warning" : "status-pill"}>
            {reviewSession ? "Validated" : "Local review"}
          </span>
        </div>
        <p>Review and edit drafts locally before any later export flow. No Azure Test Plans item is created here.</p>
        <InfoGrid
          items={[
            ["Total", String(summary.totalReviewed)],
            ["Ready later", String(summary.readyForExport)],
            ["Approved", String(summary.approved)],
            ["Rejected", String(summary.rejected)],
            ["Blocked", String(summary.blocked)],
            ["Edited", String(summary.edited)]
          ]}
        />
        <SecondaryAction
          label={reviewStatus === "loading" ? "Validating review..." : "Validate review decisions"}
          disabled={reviewStatus === "loading" || reviewCases.length === 0}
          onClick={onValidateReviewDecisions}
        />
        <InfoCard title="Review status" body={reviewMessage} tone={reviewStatus === "error" ? "warning" : "neutral"} />
        <AnalysisList title="Review warnings" items={summary.warnings} />
      </article>
      {reviewSession ? (
        <>
          <TestPlansReadinessCard
            reviewSession={reviewSession}
            status={readinessStatus}
            message={readinessMessage}
            readiness={readiness}
            onPreview={onPreviewReadiness}
            selectedCandidateIds={selectedCandidateIds}
            creationConfirmed={creationConfirmed}
            creationStatus={creationStatus}
            creationMessage={creationMessage}
            creationResult={creationResult}
            onSelectedCandidateIdsChange={onSelectedCandidateIdsChange}
            onCreationConfirmedChange={onCreationConfirmedChange}
            onCreateSelected={onCreateSelected}
          />
          <AutomationCandidateCard
            reviewSession={reviewSession}
            status={automationMappingStatus}
            message={automationMappingMessage}
            result={automationMappingResult}
            options={automationMappingOptions}
            onOptionsChange={onAutomationMappingOptionsChange}
            refinementStatus={automationRefinementStatus}
            refinementMessage={automationRefinementMessage}
            refinementResult={automationRefinementResult}
            llmProviderStatus={llmProviderStatus}
            onMap={onMapAutomationCandidates}
            onRequestRefinement={onRequestAutomationRefinement}
          />
        </>
      ) : null}
      <div className="draft-list">
        {result.draftCases.map((draftCase) => (
          <TestCaseReviewEditor
            key={draftCase.id}
            draftCase={draftCase}
            reviewCase={reviewCases.find((reviewCase) => reviewCase.originalDraftId === draftCase.id) ?? createReviewedCaseFromDraft(draftCase)}
            onChange={(updater) => updateReviewCase(draftCase.id, updater)}
          />
        ))}
      </div>
      <p className="trust-note">{reviewSession?.disclaimer ?? result.disclaimer}</p>
    </div>
  );
}

function TestPlansReadinessCard({
  reviewSession,
  status,
  message,
  readiness,
  onPreview,
  selectedCandidateIds,
  creationConfirmed,
  creationStatus,
  creationMessage,
  creationResult,
  onSelectedCandidateIdsChange,
  onCreationConfirmedChange,
  onCreateSelected
}: {
  reviewSession: TestCaseReviewSession;
  status: TestPlansReadinessStatus;
  message: string;
  readiness: TestPlansReadinessResult | null;
  onPreview: () => void;
  selectedCandidateIds: string[];
  creationConfirmed: boolean;
  creationStatus: TestPlansCreationRequestStatus;
  creationMessage: string;
  creationResult: TestPlansCreationResult | null;
  onSelectedCandidateIdsChange: (candidateIds: string[]) => void;
  onCreationConfirmedChange: (confirmed: boolean) => void;
  onCreateSelected: () => void;
}) {
  const hasReadyCases = reviewSession.summary.readyForExport > 0;
  const canCreate = readiness?.status === "ready-for-confirmation"
    && selectedCandidateIds.length > 0
    && creationConfirmed
    && creationStatus !== "loading";

  function toggleCandidate(candidateId: string): void {
    onSelectedCandidateIdsChange(
      selectedCandidateIds.includes(candidateId)
        ? selectedCandidateIds.filter((id) => id !== candidateId)
        : [...selectedCandidateIds, candidateId]
    );
  }

  return (
    <article className="info-card readiness-card">
      <div className="card-row">
        <h4>Azure Test Plans readiness preview</h4>
        <span className={readiness?.status === "ready-for-confirmation" ? "status-pill success" : readiness?.status === "blocked" ? "status-pill warning" : "status-pill"}>
          {readiness?.status ?? "Preview only"}
        </span>
      </div>
      <p>Preview only - nothing will be created in Azure.</p>
      <p>This will create selected test cases in Azure Test Plans only after final confirmation. Nothing else will be created or updated.</p>
      <SecondaryAction
        label={status === "loading" ? "Previewing readiness..." : "Preview Test Plans readiness"}
        disabled={status === "loading" || !hasReadyCases}
        onClick={onPreview}
      />
      <InfoCard
        title="Readiness status"
        body={hasReadyCases ? message : "Approve and validate at least one reviewed case before previewing Azure Test Plans readiness."}
        tone={status === "error" || !hasReadyCases ? "warning" : "neutral"}
      />
      {readiness ? (
        <div className="readiness-result">
          <InfoGrid
            items={[
              ["Mode", readiness.mode],
              ["Generated", formatDateTime(readiness.generatedAt)],
              ["Target", `${readiness.target.organization}/${readiness.target.project}/${readiness.target.team}`],
              ["Plan/Suite", `${formatOptionalValue(readiness.target.testPlanId)} / ${formatOptionalValue(readiness.target.testSuiteId)}`]
            ]}
          />
          <ReadinessCandidateList
            candidates={readiness.candidates}
            selectedCandidateIds={selectedCandidateIds}
            onToggleCandidate={toggleCandidate}
          />
          <ReadinessBlockedList blockedItems={readiness.blockedItems} />
          <AnalysisList title="Warnings" items={readiness.warnings.map((warning) => `${warning.code}: ${warning.message}`)} />
          <AnalysisList title="Required future confirmations" items={readiness.requiredUserConfirmations} />
          <p className="trust-note">{readiness.disclaimer}</p>
          <article className="info-card creation-card">
            <div className="card-row">
              <h4>Final creation confirmation</h4>
              <span className={creationResult?.status === "created" ? "status-pill success" : creationResult?.status === "partial-success" || creationResult?.status === "failed" ? "status-pill warning" : "status-pill"}>
                {creationResult?.status ?? "Not created"}
              </span>
            </div>
            <p>Only the selected approved cases will be sent. Blocked and non-selected cases will not be created.</p>
            <label className="choice-row">
              <input
                type="checkbox"
                checked={creationConfirmed}
                disabled={readiness.status !== "ready-for-confirmation" || selectedCandidateIds.length === 0 || creationStatus === "loading"}
                onChange={(event) => onCreationConfirmedChange(event.target.checked)}
              />
              <span>
                <strong>I confirm QA Assist should create only the selected test cases in Azure Test Plans.</strong>
                <small>No story links, bugs, automation, comments, or database records will be created in this step.</small>
              </span>
            </label>
            <SecondaryAction
              label={creationStatus === "loading" ? "Creating selected test cases..." : "Create selected in Azure Test Plans"}
              disabled={!canCreate}
              onClick={onCreateSelected}
            />
            <InfoCard title="Creation status" body={creationMessage} tone={creationStatus === "error" || creationResult?.status === "failed" || creationResult?.status === "partial-success" ? "warning" : "neutral"} />
            {creationResult ? <TestPlansCreationResultView result={creationResult} /> : null}
          </article>
        </div>
      ) : null}
    </article>
  );
}

function ReadinessCandidateList({
  candidates,
  selectedCandidateIds,
  onToggleCandidate
}: {
  candidates: TestPlansReadinessResult["candidates"];
  selectedCandidateIds: string[];
  onToggleCandidate: (candidateId: string) => void;
}) {
  if (candidates.length === 0) {
    return <AnalysisList title="Export candidates" items={[]} />;
  }

  return (
    <div className="analysis-list readiness-list">
      <span>Export candidates - none selected by default</span>
      <div className="choice-list">
        {candidates.map((candidate) => (
          <label key={candidate.originalDraftId} className="choice-row">
            <input
              type="checkbox"
              checked={selectedCandidateIds.includes(candidate.reviewedCaseId)}
              onChange={() => onToggleCandidate(candidate.reviewedCaseId)}
            />
            <span>
              <strong>{candidate.title}</strong>
              <small>{candidate.stepsCount} steps | {candidate.evidenceLinkCount} evidence links | {candidate.warningCount} warnings</small>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ReadinessBlockedList({ blockedItems }: { blockedItems: TestPlansReadinessResult["blockedItems"] }) {
  if (blockedItems.length === 0) {
    return <AnalysisList title="Blocked items" items={[]} />;
  }

  return (
    <div className="analysis-list readiness-list">
      <span>Blocked items</span>
      <ul>
        {blockedItems.map((item) => (
          <li key={item.originalDraftId}>
            {item.title} ({item.status}): {item.reasons.join(" ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestPlansCreationResultView({ result }: { result: TestPlansCreationResult }) {
  return (
    <div className="creation-result">
      <InfoGrid
        items={[
          ["Mode", result.mode],
          ["Completed", formatDateTime(result.completedAt)],
          ["Created", String(result.createdItems.length)],
          ["Failed", String(result.failedItems.length)],
          ["Skipped", String(result.skippedItems.length)]
        ]}
      />
      <AnalysisList
        title="Created items"
        items={result.createdItems.map((item) => `#${item.azureWorkItemId} - ${item.title}`)}
      />
      <AnalysisList
        title="Failed items"
        items={result.failedItems.map(formatCreationFailure)}
      />
      <AnalysisList
        title="Skipped items"
        items={result.skippedItems.map((item) => `${item.title}: ${item.reason}`)}
      />
      <p className="trust-note">{result.disclaimer}</p>
    </div>
  );
}

function formatCreationFailure(item: TestPlansCreationResult["failedItems"][number]): string {
  if (item.partiallyCreated) {
    const workItem = item.azureWorkItemId ? ` Azure test case #${item.azureWorkItemId} was created.` : " An Azure test case may have been created.";
    const url = item.azureWorkItemUrl ? ` ${item.azureWorkItemUrl}` : "";
    return `${item.title}: ${item.reason}${workItem}${url}`;
  }

  return `${item.title}: ${item.reason}`;
}

function AutomationCandidateCard({
  reviewSession,
  status,
  message,
  result,
  options,
  onOptionsChange,
  refinementStatus,
  refinementMessage,
  refinementResult,
  llmProviderStatus,
  onMap,
  onRequestRefinement
}: {
  reviewSession: TestCaseReviewSession;
  status: AutomationMappingStatus;
  message: string;
  result: AutomationCandidateMappingResult | null;
  options: Required<AutomationMappingOptions>;
  onOptionsChange: (options: Required<AutomationMappingOptions>) => void;
  refinementStatus: AiAssistStatus;
  refinementMessage: string;
  refinementResult: AiRefinementResult | null;
  llmProviderStatus: LlmProviderConfigurationSummary | null;
  onMap: () => void;
  onRequestRefinement: () => void;
}) {
  function toggleOption(key: keyof Required<AutomationMappingOptions>): void {
    onOptionsChange({ ...options, [key]: !options[key] });
  }

  return (
    <article className="info-card automation-card">
      <div className="card-row">
        <h4>Automation candidates</h4>
        <span className={result?.summary.readyCount ? "status-pill success" : result ? "status-pill warning" : "status-pill"}>
          {result ? "Mapped" : "Planning only"}
        </span>
      </div>
      <p>Planning only - no automation code created.</p>
      <div className="choice-list compact">
        <DraftOption label="Prefer UI" checked={options.preferUi} onChange={() => toggleOption("preferUi")} />
        <DraftOption label="Prefer API" checked={options.preferApi} onChange={() => toggleOption("preferApi")} />
        <DraftOption label="Include blocked cases" checked={options.includeBlocked} onChange={() => toggleOption("includeBlocked")} />
      </div>
      <SecondaryAction
        label={status === "loading" ? "Mapping automation candidates..." : "Map automation candidates"}
        disabled={status === "loading" || reviewSession.reviewedCases.length === 0}
        onClick={onMap}
      />
      <InfoCard title="Automation mapping status" body={message} tone={status === "error" ? "warning" : "neutral"} />
      {result ? <AutomationCandidateResult result={result} /> : null}
      {result ? (
        <AiRefinementCard
          title="AI-assisted automation refinements"
          status={refinementStatus}
          message={refinementMessage}
          result={refinementResult}
          llmProviderStatus={llmProviderStatus}
          canRequest={Boolean(result)}
          loadingLabel="Requesting automation refinements..."
          actionLabel="Request AI refinement for automation mapping"
          onRequest={onRequestRefinement}
        />
      ) : null}
    </article>
  );
}

function AutomationCandidateResult({ result }: { result: AutomationCandidateMappingResult }) {
  return (
    <div className="automation-result">
      <InfoGrid
        items={[
          ["Generated", formatDateTime(result.generatedAt)],
          ["Reviewed", String(result.summary.totalReviewed)],
          ["Candidates", String(result.summary.candidateCount)],
          ["Ready", String(result.summary.readyCount)],
          ["Needs work", String(result.summary.needsWorkCount)],
          ["Manual-only", String(result.summary.manualOnlyCount)]
        ]}
      />
      <div className="analysis-list readiness-list">
        <span>Candidates</span>
        {result.candidates.length > 0 ? (
          <ul>
            {result.candidates.map((candidate) => (
              <li key={candidate.reviewedCaseId}>
                <strong>{candidate.title}</strong> - {candidate.candidateType}, {candidate.readiness}. {candidate.recommendedStartingPoint}
                <BriefingList title="Reasons" items={candidate.reasons.map((reason) => reason.evidence ? `${reason.text} (${reason.evidence})` : reason.text)} />
                <BriefingList title="Blockers" items={candidate.blockers.map((blocker) => `${blocker.severity}: ${blocker.text}`)} />
              </li>
            ))}
          </ul>
        ) : (
          <p>No automation candidates returned.</p>
        )}
      </div>
      <div className="analysis-list readiness-list">
        <span>Blocked/manual-only cases</span>
        {result.blockedCases.length > 0 ? (
          <ul>
            {result.blockedCases.map((blockedCase) => (
              <li key={blockedCase.reviewedCaseId}>
                {blockedCase.title} ({blockedCase.status}): {blockedCase.blockers.map((blocker) => blocker.text).join(" ")}
              </li>
            ))}
          </ul>
        ) : (
          <p>No blocked cases returned in this mapping.</p>
        )}
      </div>
      <p className="trust-note">{result.disclaimer}</p>
    </div>
  );
}

function ReviewExportCard({
  status,
  message,
  result,
  format,
  selectedSections,
  onFormatChange,
  onSelectedSectionsChange,
  canExport,
  onGenerate
}: {
  status: ReviewExportStatus;
  message: string;
  result: ReviewExportResult | null;
  format: ReviewExportFormat;
  selectedSections: ReviewExportSection[];
  onFormatChange: (format: ReviewExportFormat) => void;
  onSelectedSectionsChange: (sections: ReviewExportSection[]) => void;
  canExport: boolean;
  onGenerate: () => void;
}) {
  function toggleSection(section: ReviewExportSection): void {
    onSelectedSectionsChange(
      selectedSections.includes(section)
        ? selectedSections.filter((item) => item !== section)
        : [...selectedSections, section]
    );
  }

  async function copyExportContent(): Promise<void> {
    if (!result) return;
    await navigator.clipboard.writeText(result.artifact.content);
  }

  function downloadExportContent(): void {
    if (!result) return;
    const blob = new Blob([result.artifact.content], { type: result.artifact.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.artifact.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <article className="info-card export-card">
      <div className="card-row">
        <h3>Export review package</h3>
        <span className={result ? "status-pill success" : "status-pill"}>{result ? "Generated" : "Export only"}</span>
      </div>
      <p>Export only - nothing will be written to external systems.</p>
      <div className="choice-list compact">
        <label className="choice-row compact">
          <input type="radio" checked={format === "markdown"} onChange={() => onFormatChange("markdown")} />
          <span><strong>Markdown</strong></span>
        </label>
        <label className="choice-row compact">
          <input type="radio" checked={format === "json"} onChange={() => onFormatChange("json")} />
          <span><strong>JSON</strong></span>
        </label>
      </div>
      <div className="choice-list compact">
        {REVIEW_EXPORT_SECTION_OPTIONS.map((section) => (
          <DraftOption
            key={section.value}
            label={section.label}
            checked={selectedSections.includes(section.value)}
            onChange={() => toggleSection(section.value)}
          />
        ))}
      </div>
      <InfoGrid
        items={[
          ["Selected sections", String(selectedSections.length)],
          ["Format", format]
        ]}
      />
      <SecondaryAction
        label={status === "loading" ? "Generating export package..." : "Generate export package"}
        disabled={status === "loading" || !canExport || selectedSections.length === 0}
        onClick={onGenerate}
      />
      <InfoCard title="Export status" body={message} tone={status === "error" ? "warning" : "neutral"} />
      {result ? (
        <div className="export-result">
          <InfoGrid
            items={[
              ["File", result.artifact.fileName],
              ["Included sections", String(result.summary.includedSections.length)],
              ["Warnings", String(result.summary.warnings.length)]
            ]}
          />
          <AnalysisList title="Export warnings" items={result.summary.warnings} />
          <div className="review-actions">
            <button type="button" onClick={copyExportContent}>Copy</button>
            <button type="button" onClick={downloadExportContent}>Download</button>
          </div>
          <pre className="preview-text">{truncateLongText(result.artifact.content, 1600)}</pre>
          <p className="trust-note">{result.disclaimer}</p>
        </div>
      ) : null}
    </article>
  );
}

function WritebackHelperCard({
  status,
  message,
  result,
  helperType,
  userNotes,
  targetState,
  attachmentFileName,
  attachmentContentType,
  attachmentSizeBytes,
  refinementStatus,
  refinementMessage,
  refinementResult,
  llmProviderStatus,
  canPreview,
  onHelperTypeChange,
  onUserNotesChange,
  onTargetStateChange,
  onAttachmentFileNameChange,
  onAttachmentContentTypeChange,
  onAttachmentSizeBytesChange,
  onPreview,
  onRequestRefinement
}: {
  status: WritebackPreviewRequestStatus;
  message: string;
  result: WritebackPreviewResult | null;
  helperType: WritebackHelperType;
  userNotes: string;
  targetState: string;
  attachmentFileName: string;
  attachmentContentType: string;
  attachmentSizeBytes: string;
  refinementStatus: AiAssistStatus;
  refinementMessage: string;
  refinementResult: AiRefinementResult | null;
  llmProviderStatus: LlmProviderConfigurationSummary | null;
  canPreview: boolean;
  onHelperTypeChange: (helperType: WritebackHelperType) => void;
  onUserNotesChange: (notes: string) => void;
  onTargetStateChange: (targetState: string) => void;
  onAttachmentFileNameChange: (fileName: string) => void;
  onAttachmentContentTypeChange: (contentType: string) => void;
  onAttachmentSizeBytesChange: (sizeBytes: string) => void;
  onPreview: () => void;
  onRequestRefinement: () => void;
}) {
  return (
    <article className="info-card writeback-card">
      <div className="card-row">
        <h3>Write-back helpers</h3>
        <span className={result?.status === "ready-for-review" ? "status-pill success" : result ? "status-pill warning" : "status-pill"}>
          {result?.status ?? "Preview only"}
        </span>
      </div>
      <p>Preview only - nothing will be written to Azure DevOps. Final submission is not implemented in this step.</p>
      <SelectInput
        label="Helper type"
        value={helperType}
        options={WRITEBACK_HELPER_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
        placeholder="Select helper"
        onChange={(value) => onHelperTypeChange(value as WritebackHelperType)}
      />
      <TextAreaInput
        label="User notes"
        value={userNotes}
        placeholder="Add actual result, comment wording, or transition reason."
        onChange={onUserNotesChange}
      />
      {helperType === "state-transition" ? (
        <TextInput label="Target state" placeholder="Ready for UAT" value={targetState} onChange={onTargetStateChange} />
      ) : null}
      {helperType === "attachment-metadata" ? (
        <>
          <TextInput label="Attachment file name" placeholder="evidence-note.md" value={attachmentFileName} onChange={onAttachmentFileNameChange} />
          <TextInput label="Attachment content type optional" placeholder="text/markdown" value={attachmentContentType} onChange={onAttachmentContentTypeChange} />
          <TextInput label="Attachment size bytes optional" placeholder="2048" value={attachmentSizeBytes} onChange={onAttachmentSizeBytesChange} />
        </>
      ) : null}
      <SecondaryAction
        label={status === "loading" ? "Previewing helper..." : "Preview write-back helper"}
        disabled={status === "loading" || !canPreview}
        onClick={onPreview}
      />
      <InfoCard title="Helper status" body={message} tone={status === "error" ? "warning" : "neutral"} />
      {result ? (
        <div className="writeback-result">
          <InfoGrid
            items={[
              ["Helper", result.helperType],
              ["Status", result.status],
              ["Warnings", String(result.warnings.length)]
            ]}
          />
          <AnalysisList title="Warnings" items={result.warnings.map((warning) => `${warning.code}: ${warning.message}`)} />
          <AnalysisList title="Required confirmations" items={result.requiredConfirmations} />
          <pre className="preview-text">{JSON.stringify(result.preview, null, 2)}</pre>
          <p className="trust-note">{result.disclaimer}</p>
          <AiRefinementCard
            title="AI-assisted write-back refinements"
            status={refinementStatus}
            message={refinementMessage}
            result={refinementResult}
            llmProviderStatus={llmProviderStatus}
            canRequest={Boolean(result)}
            loadingLabel="Requesting wording refinements..."
            actionLabel="Request AI wording refinement"
            onRequest={onRequestRefinement}
          />
        </div>
      ) : null}
    </article>
  );
}

function TestCaseReviewEditor({
  draftCase,
  reviewCase,
  onChange
}: {
  draftCase: TestCaseDraft;
  reviewCase: ReviewedTestCase;
  onChange: (updater: (reviewCase: ReviewedTestCase) => ReviewedTestCase) => void;
}) {
  function markEdited(updates: Partial<ReviewedTestCase>): ReviewedTestCase {
    return {
      ...reviewCase,
      ...updates,
      status: reviewCase.status === "approved-for-export" ? "edited" : updates.status ?? (reviewCase.status === "needs-review" ? "edited" : reviewCase.status),
      decision: updates.decision ?? "edit",
      approvedByUser: updates.approvedByUser ?? false,
      readyForExport: false,
      editedByUser: true,
      updatedAt: new Date().toISOString()
    };
  }

  function updateStep(order: number, key: "action" | "expectedResult", value: string): void {
    onChange(() => markEdited({
      reviewedSteps: reviewCase.reviewedSteps.map((step) =>
        step.order === order ? { ...step, [key]: value } : step
      )
    }));
  }

  function setDecision(decision: ReviewedTestCase["decision"]): void {
    const statusByDecision: Record<ReviewedTestCase["decision"], ReviewedTestCase["status"]> = {
      approve: "approved-for-export",
      reject: "rejected",
      edit: "edited",
      block: "blocked"
    };

    onChange((current) => ({
      ...current,
      status: statusByDecision[decision],
      decision,
      approvedByUser: decision === "approve",
      readyForExport: decision === "approve",
      updatedAt: new Date().toISOString()
    }));
  }

  return (
    <article className="draft-case review-case">
      <div className="card-row">
        <h4>{reviewCase.reviewedTitle || draftCase.title}</h4>
        <span className={reviewCase.status === "approved-for-export" ? "status-pill success" : reviewCase.status === "blocked" || reviewCase.status === "rejected" ? "status-pill warning" : "status-pill"}>
          {reviewCase.status}
        </span>
      </div>
      <InfoGrid
        items={[
          ["Priority", draftCase.priority],
          ["Certainty", draftCase.certainty],
          ["Type", draftCase.testType]
        ]}
      />
      <TextInput label="Reviewed title" value={reviewCase.reviewedTitle} onChange={(value) => onChange(() => markEdited({ reviewedTitle: value }))} />
      <TextAreaInput label="Reviewed objective" value={reviewCase.reviewedObjective} onChange={(value) => onChange(() => markEdited({ reviewedObjective: value }))} />
      <BriefingList title="Preconditions" items={reviewCase.reviewedPreconditions} />
      <div className="review-step-list">
        <span>Reviewed steps</span>
        {reviewCase.reviewedSteps.map((step) => (
          <div className="review-step" key={step.order}>
            <TextAreaInput label={`Step ${step.order} action`} value={step.action} onChange={(value) => updateStep(step.order, "action", value)} />
            <TextAreaInput label={`Step ${step.order} expected`} value={step.expectedResult} onChange={(value) => updateStep(step.order, "expectedResult", value)} />
          </div>
        ))}
      </div>
      <TextAreaInput label="Reviewed expected result" value={reviewCase.reviewedExpectedResult} onChange={(value) => onChange(() => markEdited({ reviewedExpectedResult: value }))} />
      <TextAreaInput label="Reviewer note optional" value={reviewCase.reviewerNote ?? ""} onChange={(value) => onChange(() => markEdited({ reviewerNote: value }))} />
      <div className="review-actions">
        <button type="button" onClick={() => setDecision("approve")}>Approve for later export</button>
        <button type="button" onClick={() => setDecision("reject")}>Reject</button>
        <button type="button" onClick={() => setDecision("block")}>Block</button>
      </div>
      <BriefingList title="Evidence links" items={reviewCase.evidenceLinks.map((link) => `${link.label} (${link.certainty})`)} />
      <BriefingList title="Warnings" items={reviewCase.warnings.map((warning) => warning.message)} />
    </article>
  );
}

function createReviewedCaseFromDraft(draftCase: TestCaseDraft): ReviewedTestCase {
  const now = new Date().toISOString();

  return {
    originalDraftId: draftCase.id,
    reviewedTitle: draftCase.title,
    reviewedObjective: draftCase.objective,
    reviewedPreconditions: draftCase.preconditions,
    reviewedSteps: draftCase.steps,
    reviewedExpectedResult: draftCase.expectedResult,
    status: "needs-review",
    decision: "edit",
    editedByUser: false,
    approvedByUser: false,
    readyForExport: false,
    sourceDraft: draftCase,
    evidenceLinks: draftCase.evidenceLinks,
    warnings: draftCase.warnings,
    updatedAt: now
  };
}

function buildLocalReviewSummary(reviewCases: ReviewedTestCase[], totalDrafts: number): TestCaseReviewSession["summary"] {
  const summary: TestCaseReviewSession["summary"] = {
    totalDrafts,
    totalReviewed: reviewCases.length,
    approved: reviewCases.filter((reviewCase) => reviewCase.status === "approved-for-export").length,
    rejected: reviewCases.filter((reviewCase) => reviewCase.status === "rejected").length,
    blocked: reviewCases.filter((reviewCase) => reviewCase.status === "blocked").length,
    edited: reviewCases.filter((reviewCase) => reviewCase.editedByUser || reviewCase.status === "edited").length,
    readyForExport: reviewCases.filter((reviewCase) => reviewCase.readyForExport).length,
    needsReview: reviewCases.filter((reviewCase) => reviewCase.status === "needs-review").length,
    warnings: []
  };

  if (summary.readyForExport === 0) {
    summary.warnings.push("No cases are approved for later export yet.");
  }

  return summary;
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return (
      <div className="analysis-list">
        <span>{title}</span>
        <p>No items returned in this preview.</p>
      </div>
    );
  }

  return (
    <div className="analysis-list">
      <span>{title}</span>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function formatAnalysisItem(item: { text: string; severity: string; certainty: string }): string {
  return `${item.text} (${item.severity}, ${item.certainty})`;
}

function formatAssistSuggestion(item: { text: string; certainty: string }): string {
  return `${item.text} (${item.certainty})`;
}

function formatProviderStatusMessage(status: LlmProviderConfigurationSummary): string {
  if (status.availability === "available") {
    return `${status.provider} is available from the backend. Deterministic mode remains the default.`;
  }

  return status.reason ?? "AI provider is disabled or misconfigured on the backend. Deterministic mode remains available.";
}

function formatLinkedEvidenceItem(item: StoryLinkedKnowledgeEvidence): string {
  return `${item.title} (${item.kind}, ${item.certainty}) - ${item.evidenceLabel}`;
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

function hasExportableStoryData(input: {
  workItemDetail: WorkItemDetail | null;
  storyAnalysis: StoryRequirementAnalysis | null;
  aiAssistResult: StoryAnalysisAssistResult | null;
  draftResult: TestCaseDraftGenerationResult | null;
  reviewSession: TestCaseReviewSession | null;
  testPlansReadiness: TestPlansReadinessResult | null;
  testPlansCreationResult: TestPlansCreationResult | null;
  automationMappingResult: AutomationCandidateMappingResult | null;
}): boolean {
  return Boolean(
    input.workItemDetail
    || input.storyAnalysis
    || input.aiAssistResult
    || input.draftResult
    || input.reviewSession
    || input.testPlansReadiness
    || input.testPlansCreationResult
    || input.automationMappingResult
  );
}

function buildWritebackEvidence(
  analysis: StoryRequirementAnalysis | null,
  reviewSession: TestCaseReviewSession | null
) {
  const analysisEvidence = analysis?.evidence.slice(0, 4).map((item, index) => ({
    id: `analysis-${index}`,
    label: item.label,
    summary: item.excerpt,
    source: item.source
  })) ?? [];
  const reviewEvidence = reviewSession?.reviewedCases.flatMap((reviewCase) =>
    reviewCase.evidenceLinks.slice(0, 2).map((link) => ({
      id: `${reviewCase.originalDraftId}-${link.id}`,
      label: link.label,
      summary: link.excerpt,
      source: link.source
    }))
  ).slice(0, 6) ?? [];

  return [...analysisEvidence, ...reviewEvidence];
}

function SettingsPanel({
  themePreference,
  onThemeChange,
  settings,
  onSettingsChange,
  setupStatus,
  setupMessage,
  llmProviderStatus,
  llmProviderMessage,
  onSetupStatusChange,
  onSetupMessageChange,
  projectOptions,
  onProjectOptionsChange,
  teamOptions,
  onTeamOptionsChange,
  onLatestExtractionResult
}: {
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  settings: ExtensionSettings;
  onSettingsChange: (settings: ExtensionSettings) => void;
  setupStatus: SetupStatus;
  setupMessage: string;
  llmProviderStatus: LlmProviderConfigurationSummary | null;
  llmProviderMessage: string;
  onSetupStatusChange: (status: SetupStatus) => void;
  onSetupMessageChange: (message: string) => void;
  projectOptions: AzureDevOpsProjectOption[];
  onProjectOptionsChange: (projects: AzureDevOpsProjectOption[]) => void;
  teamOptions: AzureDevOpsTeamOption[];
  onTeamOptionsChange: (teams: AzureDevOpsTeamOption[]) => void;
  onLatestExtractionResult: (result: KnowledgeExtractionResult | null) => void;
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
            ["Destination", "Test plan and suite IDs are non-secret local configuration."],
            ["Story links", "Approved test cases can later link back to the story."],
            ["Approval", "Creating or updating test cases will require explicit final user approval."]
          ]}
        />
        <div className="settings-form">
          <TextInput
            label="Azure Test Plan ID optional"
            help="Non-secret target ID for readiness preview only. No Azure Test Plans write-back is active."
            value={settings.testPlanId}
            onChange={(value) => updateSetting("testPlanId", value)}
          />
          <TextInput
            label="Azure Test Suite ID optional"
            help="Non-secret target ID for readiness preview only."
            value={settings.testSuiteId}
            onChange={(value) => updateSetting("testSuiteId", value)}
          />
          <TextInput
            label="Default area path optional"
            value={settings.testManagementAreaPath}
            onChange={(value) => updateSetting("testManagementAreaPath", value)}
          />
          <TextInput
            label="Default iteration path optional"
            value={settings.testManagementIterationPath}
            onChange={(value) => updateSetting("testManagementIterationPath", value)}
          />
        </div>
        <TrustNote text="These fields are not secrets. They only help QA Assist preview future Azure Test Plans readiness; nothing is created in Azure." />
      </SettingsCard>
      <BoardKnowledgeSettingsCard
        settings={settings}
        selectedTeamReady={selectedTeamReady}
        onSettingsChange={onSettingsChange}
        onLatestExtractionResult={onLatestExtractionResult}
      />
      <SettingsCard
        title="AI Analysis"
        status={<span className={llmProviderStatus?.availability === "available" ? "status-pill success" : llmProviderStatus?.availability === "misconfigured" ? "status-pill warning" : "status-pill"}>{llmProviderStatus?.availability ?? "unknown"}</span>}
        body="AI support is optional, backend-mediated, and suggestion-only. Deterministic mode remains the default."
      >
        <InfoGrid
          items={[
            ["Provider", llmProviderStatus?.provider ?? "Unknown"],
            ["Model", llmProviderStatus?.model ?? "Not configured"],
            ["Backend API key", llmProviderStatus?.apiKeyConfigured ? "Configured on backend" : "Not configured"],
            ["Base URL", llmProviderStatus?.baseUrlConfigured ? "Configured on backend" : "Default or not configured"]
          ]}
        />
        <InfoCard title="Provider status" body={llmProviderMessage} tone={llmProviderStatus?.availability === "misconfigured" ? "warning" : "neutral"} />
        <TrustNote text="AI provider configuration is backend-only. No API key is stored in the extension. AI-assisted refinement is optional; deterministic output remains the default and suggestions require QA review." />
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

function BoardKnowledgeSettingsCard({
  settings,
  selectedTeamReady,
  onSettingsChange,
  onLatestExtractionResult
}: {
  settings: ExtensionSettings;
  selectedTeamReady: boolean;
  onSettingsChange: (settings: ExtensionSettings) => void;
  onLatestExtractionResult: (result: KnowledgeExtractionResult | null) => void;
}) {
  const [sourceType, setSourceType] = useState<BoardKnowledgeSourceType>("requirement-document");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [fileMetadata, setFileMetadata] = useState<BoardKnowledgeUploadDraft["file"]>();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("Content upload and indexing are not active yet. This step stores only source metadata for review.");
  const [extractionSourceId, setExtractionSourceId] = useState("");
  const [extractionFileName, setExtractionFileName] = useState("");
  const [extractionText, setExtractionText] = useState("");
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "extracting" | "success" | "error">("idle");
  const [extractionMessage, setExtractionMessage] = useState("Paste .txt or .md text manually to preview extraction. Nothing is stored or indexed.");
  const [extractionResult, setExtractionResult] = useState<KnowledgeExtractionResult | null>(null);

  const selectedBoard = selectedTeamReady ? buildBoardScope(settings) : null;
  const scopedSources = selectedBoard
    ? settings.boardKnowledgeSources.filter((source) => isSameBoardKnowledgeScope(source, selectedBoard))
    : [];
  const selectedExtractionSource = scopedSources.find((source) => source.id === extractionSourceId);

  async function addMetadataOnlySource(): Promise<void> {
    if (!selectedBoard) {
      setStatus("error");
      setMessage("Select a team board before adding board knowledge metadata.");
      return;
    }

    setStatus("saving");
    setMessage("Validating metadata only. File content is not read or uploaded.");

    try {
      const draft: BoardKnowledgeUploadDraft = {
        type: sourceType,
        title,
        description,
        file: fileMetadata,
        tags: parseTags(tags),
        privacyNote: "Metadata only. Content upload and indexing are not active yet."
      };
      const result = await validateBoardKnowledgeSource(settings.apiBaseUrl, { selectedBoard, source: draft });
      const nextSources = [...settings.boardKnowledgeSources, result.source];
      const scopedNextSources = nextSources.filter((source) => isSameBoardKnowledgeScope(source, selectedBoard));
      const summaryResult = await summarizeBoardKnowledge(settings.apiBaseUrl, { selectedBoard, sources: scopedNextSources });

      onSettingsChange({ ...settings, boardKnowledgeSources: nextSources });
      setTitle("");
      setDescription("");
      setTags("");
      setFileMetadata(undefined);
      setStatus("success");
      setMessage(`Metadata source added. ${summaryResult.summary.totalSources} source${summaryResult.summary.totalSources === 1 ? "" : "s"} configured for this board.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Board knowledge metadata validation failed.");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    setFileMetadata(file
      ? {
          fileName: file.name,
          fileType: file.type || undefined,
          sizeBytes: file.size
        }
      : undefined);
  }

  async function previewExtraction(): Promise<void> {
    if (!selectedBoard) {
      setExtractionStatus("error");
      setExtractionMessage("Select a team board before previewing extraction.");
      return;
    }

    const sourceTitle = selectedExtractionSource?.title ?? title.trim();
    const fileName = extractionFileName.trim() || selectedExtractionSource?.file?.fileName || fileMetadata?.fileName || "";

    if (!sourceTitle) {
      setExtractionStatus("error");
      setExtractionMessage("Enter a source title or choose a configured metadata source before extraction preview.");
      return;
    }

    setExtractionStatus("extracting");
    setExtractionMessage("Sending pasted text to the backend extraction preview route...");

    try {
      const result = await extractBoardKnowledgeText(settings.apiBaseUrl, {
        selectedBoard,
        source: {
          id: selectedExtractionSource?.id,
          title: sourceTitle,
          type: selectedExtractionSource?.type ?? sourceType
        },
        file: {
          fileName,
          fileType: selectedExtractionSource?.file?.fileType ?? fileMetadata?.fileType,
          sizeBytes: selectedExtractionSource?.file?.sizeBytes ?? fileMetadata?.sizeBytes,
          textContent: extractionText
        }
      });

      setExtractionResult(result);
      onLatestExtractionResult(result);
      setExtractionStatus("success");
      setExtractionMessage("Extraction preview returned from backend. It is not stored, indexed, or analyzed.");
    } catch (error) {
      setExtractionResult(null);
      onLatestExtractionResult(null);
      setExtractionStatus("error");
      setExtractionMessage(error instanceof Error ? error.message : "Extraction preview failed.");
    }
  }

  return (
    <SettingsCard
      title="Board Knowledge"
      status={<span className="status-pill">Metadata only</span>}
      body="Configure board-scoped knowledge source metadata. Content upload, parsing, indexing, and analysis are not active yet."
    >
      <SelectedTeamBanner settings={settings} />
      <InfoCard
        title="Metadata-only foundation"
        body="Content upload and indexing are not active yet. This step stores only source metadata for review."
      />
      <div className="settings-form">
        <SelectInput
          label="Source type"
          value={sourceType}
          options={BOARD_KNOWLEDGE_SOURCE_TYPE_OPTIONS}
          placeholder="Choose source type"
          onChange={(value) => setSourceType(value as BoardKnowledgeSourceType)}
        />
        <TextInput label="Source title" value={title} onChange={setTitle} />
        <TextInput label="Source description optional" value={description} onChange={setDescription} />
        <TextInput label="Tags optional" help="Comma-separated labels, for example checkout, release-risk." value={tags} onChange={setTags} />
        <label className="settings-field">
          <span>File metadata optional</span>
          <input type="file" onChange={handleFileChange} />
          <small>{fileMetadata ? `${fileMetadata.fileName} (${formatBytes(fileMetadata.sizeBytes)}) metadata selected. File bytes are not read or sent.` : "Only name, type, and size are captured. File contents are not uploaded."}</small>
        </label>
      </div>
      <SecondaryAction label={status === "saving" ? "Adding metadata..." : "Add metadata-only source"} disabled={!selectedTeamReady || status === "saving"} onClick={addMetadataOnlySource} />
      <InfoCard title="Knowledge status" body={message} tone={status === "error" ? "warning" : "neutral"} />
      <article className="info-card extraction-preview">
        <div className="card-row">
          <h3>Extraction preview</h3>
          <span className="status-pill">Manual paste only</span>
        </div>
        <p>Preview .txt or .md text extraction through the backend. Extraction preview is not stored, indexed, or analyzed yet.</p>
        {scopedSources.length > 0 ? (
          <SelectInput
            label="Configured source optional"
            value={extractionSourceId}
            options={scopedSources.map((source) => ({ label: source.title, value: source.id }))}
            placeholder="Use current source form"
            onChange={setExtractionSourceId}
          />
        ) : null}
        <TextInput
          label="Extraction file name"
          help="Only .txt and .md are accepted for this foundation step."
          placeholder="requirements.md"
          value={extractionFileName}
          onChange={setExtractionFileName}
        />
        <TextAreaInput
          label="Paste text for extraction preview"
          help="File selector metadata is not read. Paste only content you are allowed to use for this selected team board."
          placeholder="Paste plain text or markdown here."
          value={extractionText}
          onChange={setExtractionText}
        />
        <SecondaryAction
          label={extractionStatus === "extracting" ? "Previewing extraction..." : "Preview extraction"}
          disabled={!selectedTeamReady || extractionStatus === "extracting"}
          onClick={previewExtraction}
        />
        <InfoCard title="Extraction status" body={extractionMessage} tone={extractionStatus === "error" ? "warning" : "neutral"} />
        <KnowledgeExtractionPreview result={extractionResult} />
      </article>
      <BoardKnowledgeSourceList sources={scopedSources} />
    </SettingsCard>
  );
}

function KnowledgeExtractionPreview({ result }: { result: KnowledgeExtractionResult | null }) {
  if (!result?.evidence || !result.extractedText) {
    return null;
  }

  return (
    <div className="extraction-result">
      <dl className="context-list">
        <div>
          <dt>Status</dt>
          <dd>{result.status}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{result.evidence.sourceTitle}</dd>
        </div>
        <div>
          <dt>File</dt>
          <dd>{result.evidence.fileName} | {result.evidence.contentKind} | {formatBytes(result.evidence.byteLength)}</dd>
        </div>
      </dl>
      <pre className="preview-text">{result.extractedText.textPreview}</pre>
      <BriefingList title="Warnings" items={result.warnings.map((warning) => warning.message)} />
      <BriefingList title="Limitations" items={result.limitations.slice(0, 3)} />
    </div>
  );
}

function BoardKnowledgeSourceList({ sources }: { sources: BoardKnowledgeSource[] }) {
  if (sources.length === 0) {
    return <InfoCard title="Configured sources" body="No metadata-only board knowledge sources configured for this selected team board." />;
  }

  return (
    <article className="info-card">
      <h3>Configured sources</h3>
      <ul className="knowledge-source-list">
        {sources.map((source) => (
          <li key={source.id}>
            <div>
              <strong>{source.title}</strong>
              <span>{formatSourceType(source.type)} | {source.status}</span>
            </div>
            <p>{source.evidenceLabel}</p>
          </li>
        ))}
      </ul>
    </article>
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

function TextAreaInput({
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
      <textarea placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
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

function buildTestPlansTargetSettings(settings: ExtensionSettings): TestPlansTargetSettings {
  return {
    organization: settings.organization.trim(),
    project: settings.project.trim(),
    team: settings.team.trim(),
    testPlanId: normalizeOptional(settings.testPlanId),
    testSuiteId: normalizeOptional(settings.testSuiteId),
    areaPath: normalizeOptional(settings.testManagementAreaPath),
    iterationPath: normalizeOptional(settings.testManagementIterationPath)
  };
}

function buildLinkedKnowledgeEvidence({
  settings,
  canLinkKnowledge,
  selectedKnowledgeSourceIds,
  includeLatestExtraction,
  latestExtractionResult,
  userConfirmedNote
}: {
  settings: ExtensionSettings;
  canLinkKnowledge: boolean;
  selectedKnowledgeSourceIds: string[];
  includeLatestExtraction: boolean;
  latestExtractionResult: KnowledgeExtractionResult | null;
  userConfirmedNote: string;
}): StoryLinkedKnowledgeEvidence[] {
  if (!canLinkKnowledge) {
    return [];
  }

  const selectedBoard = hasSelectedTeamBoard(settings) ? buildBoardScope(settings) : null;
  const linkedEvidence: StoryLinkedKnowledgeEvidence[] = [];

  if (selectedBoard) {
    const scopedSources = settings.boardKnowledgeSources.filter((source) => isSameBoardKnowledgeScope(source, selectedBoard));

    for (const source of scopedSources) {
      if (!selectedKnowledgeSourceIds.includes(source.id)) {
        continue;
      }

      linkedEvidence.push({
        id: source.id,
        kind: "board-knowledge-metadata",
        title: source.title,
        sourceType: source.type,
        status: source.status,
        trustLevel: source.trustLevel,
        fileName: source.file?.fileName,
        evidenceLabel: source.evidenceLabel,
        selectedByUser: true,
        limitations: [
          "Metadata-only source selected; content has not been extracted or analyzed.",
          ...source.limitations
        ],
        certainty: source.trustLevel
      });
    }
  }

  if (includeLatestExtraction && latestExtractionResult?.evidence && latestExtractionResult.extractedText) {
    linkedEvidence.push({
      id: `extraction-${latestExtractionResult.evidence.extractedAt}`,
      kind: "extracted-text-preview",
      title: latestExtractionResult.evidence.sourceTitle,
      textPreview: latestExtractionResult.extractedText.textPreview,
      fileName: latestExtractionResult.evidence.fileName,
      evidenceLabel: `Extracted preview from ${latestExtractionResult.evidence.fileName}.`,
      selectedByUser: true,
      limitations: [
        "Only extracted preview text is included; full document is not included.",
        ...latestExtractionResult.limitations
      ],
      certainty: "needs-confirmation"
    });
  }

  const trimmedNote = userConfirmedNote.trim();
  if (trimmedNote) {
    linkedEvidence.push({
      id: `user-note-${Date.now()}`,
      kind: "user-confirmed-note",
      title: "User-confirmed note",
      textPreview: trimmedNote.slice(0, 1500),
      evidenceLabel: "Short note explicitly entered by the QA user for this Story analysis request.",
      selectedByUser: true,
      limitations: ["User-confirmed note is request-scoped and is not stored as board knowledge."],
      certainty: "user-confirmed"
    });
  }

  return linkedEvidence;
}

function canLinkKnowledgeForStory(
  settings: ExtensionSettings,
  pageContext: AzureDevOpsPageContext | null,
  workItemDetail: WorkItemDetail
): boolean {
  if (!hasSelectedTeamBoard(settings)) {
    return false;
  }

  const storyProject = pageContext?.project ?? workItemDetail.project;
  return settings.project.trim().toLowerCase() === storyProject.trim().toLowerCase();
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

function isSameBoardKnowledgeScope(source: BoardKnowledgeSource, board: BoardScope): boolean {
  return source.scope.organization === board.organization
    && source.scope.project === board.project
    && source.scope.team === board.team;
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatSourceType(type: BoardKnowledgeSourceType): string {
  return type
    .split("-")
    .map((part) => part.toUpperCase() === "QA" ? "QA" : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatBytes(value: number | undefined): string {
  if (value === undefined) {
    return "size not available";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
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

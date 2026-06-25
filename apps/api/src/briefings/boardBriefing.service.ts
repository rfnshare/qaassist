import type {
  BoardBriefing,
  BoardBriefingEvidence,
  BoardBriefingInsight,
  BoardBriefingRisk,
  BoardSummary,
  CurrentQaUserSettings,
  QaWorkItemSummary,
  QaWorkQueue,
  WorkRecommendation
} from "@qa-assist/shared";
import { DETERMINISTIC_BOARD_BRIEFING_DISCLAIMER } from "./boardBriefingPrompt.js";

export type GenerateBoardBriefingInput = {
  boardSummary: BoardSummary;
  workQueue: QaWorkQueue;
  recommendation?: WorkRecommendation;
  currentQaUser?: CurrentQaUserSettings;
};

export function generateDeterministicBoardBriefing(input: GenerateBoardBriefingInput): BoardBriefing {
  const { boardSummary, workQueue, recommendation, currentQaUser } = input;
  const readyToRetestItems = boardSummary.resolvedBugsReadyToRetest ?? workQueue.resolvedBugsReadyToRetest;
  const myWork = boardSummary.myWork ?? workQueue.myWork;
  const suggested = recommendation?.recommendedWorkItem ?? workQueue.suggestedNextWork;
  const evidence = collectEvidence(boardSummary, workQueue, recommendation);
  const selectedTeamLabel = formatBoardLabel(boardSummary.selectedBoard);

  return {
    mode: "deterministic-preview",
    generatedAt: new Date().toISOString(),
    selectedBoard: boardSummary.selectedBoard,
    selectedTeamLabel,
    headline: buildHeadline(readyToRetestItems, myWork, suggested),
    summary: buildSummary(readyToRetestItems, myWork, suggested),
    changedOrImportant: {
      title: "What needs QA attention",
      insights: buildChangedInsights(boardSummary, readyToRetestItems, myWork)
    },
    readyToRetest: {
      title: "Ready to retest",
      insights: buildReadyToRetestInsights(readyToRetestItems)
    },
    myQaWork: {
      title: "My assigned QA work",
      insights: buildMyWorkInsights(myWork, currentQaUser)
    },
    suggestedNextWork: suggested
      ? {
          label: `Handle #${suggested.workItemId} next`,
          reason: recommendation?.reason ?? "Suggested from returned board preview ordering.",
          needsConfirmation: true,
          evidence: [workItemEvidence(suggested, "Suggested next work")]
        }
      : undefined,
    risksAndGaps: buildRisks(boardSummary, currentQaUser, recommendation),
    assumptions: [
      "This preview only uses work items returned by the board condition request.",
      "State mapping may need review if items appear in unexpected buckets.",
      ...(recommendation?.assumptions ?? [])
    ],
    needsConfirmation: [
      "Confirm whether the suggested next work is actually the right QA priority.",
      "Confirm state mapping before treating bucket guidance as final.",
      "Confirm requirement completeness in the story workspace before approving scope or test cases."
    ],
    evidence,
    confidence: evidence.length > 0 ? "medium" : "low",
    disclaimer: DETERMINISTIC_BOARD_BRIEFING_DISCLAIMER
  };
}

function buildHeadline(
  readyToRetestItems: QaWorkItemSummary[],
  myWork: QaWorkItemSummary[],
  suggested: QaWorkItemSummary | undefined
): string {
  if (readyToRetestItems.length > 0) {
    return "Retest is the first QA priority.";
  }

  if (myWork.length > 0) {
    return "Assigned QA work needs review.";
  }

  if (suggested) {
    return "A next work item is available, but it needs confirmation.";
  }

  return "No immediate QA priority was found in this preview window.";
}

function buildSummary(
  readyToRetestItems: QaWorkItemSummary[],
  myWork: QaWorkItemSummary[],
  suggested: QaWorkItemSummary | undefined
): string {
  if (readyToRetestItems.length > 0) {
    return `${readyToRetestItems.length} item${plural(readyToRetestItems.length)} look ready to retest. Start there before taking new scope if release risk allows.`;
  }

  if (myWork.length > 0) {
    return `${myWork.length} assigned QA item${plural(myWork.length)} returned in this preview. Review assignment and state before choosing execution order.`;
  }

  if (suggested) {
    return `QA Assist suggests #${suggested.workItemId} next, but this has not been validated against requirement completeness.`;
  }

  return "The returned board preview did not include ready-to-retest or assigned QA work. Expand setup or review state mapping if this seems wrong.";
}

function buildChangedInsights(
  boardSummary: BoardSummary,
  readyToRetestItems: QaWorkItemSummary[],
  myWork: QaWorkItemSummary[]
): BoardBriefingInsight[] {
  return [
    {
      text: `${readyToRetestItems.length} ready-to-retest item${plural(readyToRetestItems.length)} returned in this preview.`,
      certainty: "source-backed",
      evidence: readyToRetestItems.slice(0, 3).map((item) => workItemEvidence(item, "Ready to retest"))
    },
    {
      text: `${myWork.length} assigned QA item${plural(myWork.length)} matched the configured QA user.`,
      certainty: "source-backed",
      evidence: myWork.slice(0, 3).map((item) => workItemEvidence(item, "My assigned QA work"))
    },
    {
      text: boardSummary.openRisks.length > 0
        ? `${boardSummary.openRisks.length} open risk signal${plural(boardSummary.openRisks.length)} returned.`
        : "No open risk signals were returned in this preview.",
      certainty: "source-backed",
      evidence: [{ source: "board-summary", label: "Open risks" }]
    }
  ];
}

function buildReadyToRetestInsights(items: QaWorkItemSummary[]): BoardBriefingInsight[] {
  if (items.length === 0) {
    return [
      {
        text: "No ready-to-retest items were found in this preview window.",
        certainty: "source-backed",
        evidence: [{ source: "board-summary", label: "Ready-to-retest list was empty" }]
      }
    ];
  }

  return items.slice(0, 3).map((item) => ({
    text: `#${item.workItemId} is in ${item.state}; retest priority needs QA confirmation.`,
    certainty: "source-backed",
    evidence: [workItemEvidence(item, "Ready to retest")]
  }));
}

function buildMyWorkInsights(items: QaWorkItemSummary[], currentQaUser: CurrentQaUserSettings | undefined): BoardBriefingInsight[] {
  if (!currentQaUser?.displayName && !currentQaUser?.email) {
    return [
      {
        text: "No current QA user is configured, so assignment matching may be incomplete.",
        certainty: "needs-confirmation",
        evidence: [{ source: "work-queue", label: "Current QA user not configured" }]
      }
    ];
  }

  if (items.length === 0) {
    return [
      {
        text: "No assigned QA work matched the configured QA user in this preview.",
        certainty: "source-backed",
        evidence: [{ source: "work-queue", label: "My work list was empty" }]
      }
    ];
  }

  return items.slice(0, 3).map((item) => ({
    text: `#${item.workItemId} is assigned work in ${item.state}; confirm whether it is still yours before acting.`,
    certainty: "source-backed",
    evidence: [workItemEvidence(item, "My assigned QA work")]
  }));
}

function buildRisks(
  boardSummary: BoardSummary,
  currentQaUser: CurrentQaUserSettings | undefined,
  recommendation: WorkRecommendation | undefined
): BoardBriefingRisk[] {
  const risks: BoardBriefingRisk[] = [];

  if (!currentQaUser?.displayName && !currentQaUser?.email) {
    risks.push({
      text: "Current QA user is not configured, so assigned-work guidance may miss relevant items.",
      severity: "medium",
      certainty: "needs-confirmation",
      evidence: [{ source: "work-queue", label: "Current QA user not configured" }]
    });
  }

  if (boardSummary.openRisks.length > 0) {
    risks.push({
      text: "Open board risk signals were returned and need review before prioritizing new work.",
      severity: "high",
      certainty: "source-backed",
      evidence: [{ source: "board-summary", label: "Open risk signals" }]
    });
  }

  if (recommendation?.needsUserConfirmation) {
    risks.push({
      text: "Suggested next work is not final until QA confirms it.",
      severity: "medium",
      certainty: "needs-confirmation",
      evidence: recommendation.recommendedWorkItem ? [workItemEvidence(recommendation.recommendedWorkItem, "Recommendation")] : []
    });
  }

  return risks;
}

function collectEvidence(
  boardSummary: BoardSummary,
  workQueue: QaWorkQueue,
  recommendation: WorkRecommendation | undefined
): BoardBriefingEvidence[] {
  return [
    { source: "board-summary", label: boardSummary.sourceDescription ?? "Board condition preview" },
    { source: "work-queue", label: workQueue.dataFreshness ?? "Work queue preview" },
    ...boardSummary.resolvedBugsReadyToRetest.slice(0, 3).map((item) => workItemEvidence(item, "Ready to retest")),
    ...boardSummary.myWork.slice(0, 3).map((item) => workItemEvidence(item, "My assigned QA work")),
    ...(recommendation?.recommendedWorkItem ? [workItemEvidence(recommendation.recommendedWorkItem, "Recommendation")] : [])
  ];
}

function workItemEvidence(item: QaWorkItemSummary, label: string): BoardBriefingEvidence {
  return {
    source: "work-queue",
    label,
    workItemId: item.workItemId,
    title: truncateTitle(item.title),
    state: item.state
  };
}

function formatBoardLabel(board: BoardSummary["selectedBoard"]): string {
  return board.displayLabel ?? `${board.organization}/${board.project}/${board.team ?? "Team not selected"}`;
}

function truncateTitle(title: string): string {
  const normalized = title.replace(/\s+/g, " ").trim();
  return normalized.length > 72 ? `${normalized.slice(0, 69)}...` : normalized;
}

function plural(count: number): string {
  return count === 1 ? "" : "s";
}

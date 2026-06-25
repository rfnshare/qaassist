import type { FastifyInstance } from "fastify";
import type {
  BoardSummary,
  CurrentQaUserSettings,
  QaWorkQueue,
  WorkRecommendation
} from "@qa-assist/shared";
import { generateDeterministicBoardBriefing } from "../briefings/boardBriefing.service.js";

type BoardBriefingBody = {
  boardSummary?: unknown;
  workQueue?: unknown;
  recommendation?: WorkRecommendation;
  currentQaUser?: CurrentQaUserSettings;
};

export async function registerBriefingRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: BoardBriefingBody }>("/briefings/board", async (request) => {
    const { boardSummary, workQueue } = validateBoardBriefingBody(request.body);

    return generateDeterministicBoardBriefing({
      boardSummary,
      workQueue,
      recommendation: request.body.recommendation,
      currentQaUser: request.body.currentQaUser
    });
  });
}

function validateBoardBriefingBody(body: BoardBriefingBody | undefined): {
  boardSummary: BoardSummary;
  workQueue: QaWorkQueue;
} {
  if (!body || typeof body !== "object") {
    throw badRequest("Request body is required.");
  }

  if (!body.boardSummary || typeof body.boardSummary !== "object") {
    throw badRequest("boardSummary is required.");
  }

  if (!body.workQueue || typeof body.workQueue !== "object") {
    throw badRequest("workQueue is required.");
  }

  const boardSummary = body.boardSummary as Partial<BoardSummary>;
  const workQueue = body.workQueue as Partial<QaWorkQueue>;

  if (!boardSummary.selectedBoard || typeof boardSummary.selectedBoard !== "object") {
    throw badRequest("boardSummary.selectedBoard is required.");
  }

  if (!isNonEmptyString(boardSummary.generatedAt)) {
    throw badRequest("boardSummary.generatedAt is required.");
  }

  if (!Array.isArray(boardSummary.metrics)) {
    throw badRequest("boardSummary.metrics must be an array.");
  }

  if (!Array.isArray(boardSummary.myWork) || !Array.isArray(boardSummary.resolvedBugsReadyToRetest)) {
    throw badRequest("boardSummary work item lists must be arrays.");
  }

  if (!Array.isArray(boardSummary.openRisks)) {
    throw badRequest("boardSummary.openRisks must be an array.");
  }

  if (!Array.isArray(workQueue.buckets) || !Array.isArray(workQueue.myWork) || !Array.isArray(workQueue.resolvedBugsReadyToRetest)) {
    throw badRequest("workQueue lists must be arrays.");
  }

  return {
    boardSummary: boardSummary as BoardSummary,
    workQueue: workQueue as QaWorkQueue
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function badRequest(message: string): Error & { statusCode: number; code: "VALIDATION_ERROR" } {
  const error = new Error(message) as Error & { statusCode: number; code: "VALIDATION_ERROR" };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}

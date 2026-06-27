import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { loadEnv, type ApiEnv } from "./config/env.js";
import { registerCors } from "./plugins/cors.js";
import { registerErrorHandler } from "./plugins/errorHandler.js";
import { registerAzureDevOpsRoutes } from "./routes/azureDevOps.routes.js";
import { registerAnalysisRoutes } from "./routes/analysis.routes.js";
import { registerBriefingRoutes } from "./routes/briefings.routes.js";
import { registerHealthRoutes } from "./routes/health.routes.js";
import { registerKnowledgeRoutes } from "./routes/knowledge.routes.js";
import { registerTestCaseDraftRoutes } from "./routes/testCaseDraft.routes.js";
import { registerTestCaseReviewRoutes } from "./routes/testCaseReview.routes.js";
import { registerTestPlansCreationRoutes } from "./routes/testPlansCreation.routes.js";
import { registerTestPlansReadinessRoutes } from "./routes/testPlansReadiness.routes.js";

export type BuildAppOptions = {
  env?: ApiEnv;
};

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();
  const app = Fastify({
    logger: env.nodeEnv === "development",
    genReqId: () => randomUUID()
  });

  registerErrorHandler(app);
  await registerCors(app, env);
  await registerHealthRoutes(app);
  await registerAnalysisRoutes(app);
  await registerAzureDevOpsRoutes(app, env);
  await registerBriefingRoutes(app);
  await registerKnowledgeRoutes(app);
  await registerTestCaseDraftRoutes(app);
  await registerTestCaseReviewRoutes(app);
  await registerTestPlansReadinessRoutes(app);
  await registerTestPlansCreationRoutes(app, env);

  return app;
}

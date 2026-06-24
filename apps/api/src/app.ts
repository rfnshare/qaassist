import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { loadEnv, type ApiEnv } from "./config/env.js";
import { registerCors } from "./plugins/cors.js";
import { registerErrorHandler } from "./plugins/errorHandler.js";
import { registerHealthRoutes } from "./routes/health.routes.js";

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

  return app;
}

import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import type { ApiEnv } from "../config/env.js";

const LOCAL_DEVELOPMENT_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4317",
  "http://127.0.0.1:4317"
]);

export async function registerCors(app: FastifyInstance, env: ApiEnv): Promise<void> {
  const allowedOrigins = new Set(LOCAL_DEVELOPMENT_ORIGINS);

  if (!env.extensionOrigin.includes("replace-after-local-install")) {
    allowedOrigins.add(env.extensionOrigin);
  }

  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by QA Assist API CORS policy."), false);
    }
  });
}

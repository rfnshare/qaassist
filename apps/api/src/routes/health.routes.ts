import type { FastifyInstance } from "fastify";

const SERVICE_NAME = "qa-assist-api";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async () => ({
    service: SERVICE_NAME,
    status: "ok"
  }));

  app.get("/health", async () => ({
    service: SERVICE_NAME,
    status: "ok",
    timestamp: new Date().toISOString()
  }));
}

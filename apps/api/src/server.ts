import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";

const env = loadEnv();
const app = await buildApp({ env });

try {
  await app.listen({ host: env.host, port: env.port });
} catch (error) {
  app.log.error(error, "Failed to start QA Assist API.");
  process.exit(1);
}

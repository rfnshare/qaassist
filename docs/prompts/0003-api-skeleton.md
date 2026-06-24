# Prompt 0003 - Backend API Skeleton

Goal:
Implement Step 0003: create the backend API skeleton. This step should create a minimal TypeScript backend app with health check, basic config loading, structured error shape, CORS setup for extension development, and clean project structure. Do not implement Azure DevOps integration, auth, LLM calls, database, or QA analysis logic yet.

Preconditions:

- Step 0001 project foundation should already be committed.
- Step 0002 extension shell should already be committed.
- Start from the latest approved branch state.
- Create or switch to branch: `feature/0003-api-skeleton`.
- Do not commit.
- Do not tag.

Product context:
QA Assist is a browser-extension-based embedded QA assistant for QA engineers. The first platform will be Azure DevOps Boards. The backend will eventually mediate Azure DevOps calls, LLM provider calls, prompt templates, privacy filtering, audit logs, and QA analysis orchestration. This step only creates the backend skeleton.

Important constraints:

- Do not implement Azure DevOps OAuth yet.
- Do not implement PAT handling yet.
- Do not implement LLM provider calls yet.
- Do not implement database/storage yet.
- Do not create real auth yet.
- Do not store secrets.
- Do not add `.env` with real values.
- Use `.env.example` only.
- Preserve existing docs and project direction.
- Follow root `AGENTS.md`.
- Do not commit.
- Do not tag.

Technical direction:
Use Node.js + TypeScript. Prefer Fastify for a small, clear API skeleton unless there is a strong reason not to. Keep the implementation simple and modular.

Tasks:

1. Inspect the existing repository files and read `AGENTS.md`, `README.md`, `docs/architecture.md`, `docs/auth-plan.md`, `docs/implementation-roadmap.md`, and `docs/git-workflow.md`.
2. Create or switch to branch `feature/0003-api-skeleton`.
3. Add backend app under `apps/api`.
4. Add minimal backend package files.
5. Add source structure for `server.ts`, `app.ts`, config, health routes, CORS plugin, error handler plugin, and API error types.
6. Add root workspace scripts for API dev, build, and typecheck.
7. Add safe `.env.example` placeholder values only.
8. Add `GET /health` returning service name, status, and timestamp.
9. Add `GET /` returning service name and status.
10. Add structured error response format with `error.code`, `error.message`, and `error.requestId`.
11. Add simple request ID handling.
12. Add CORS config for local development and configured extension origin without blindly allowing every origin.
13. Do not add a database yet.
14. Do not add Azure DevOps or LLM route placeholders beyond comments or future folders unless necessary.
15. Update documentation and store this prompt.
16. Keep generated files reasonable.
17. Ensure `.gitignore` excludes backend build outputs and env files while allowing `.env.example`.

Preferred backend folder shape:

```text
apps/
  api/
    package.json
    tsconfig.json
    src/
      app.ts
      server.ts
      config/
        env.ts
      plugins/
        cors.ts
      plugins/
        errorHandler.ts
      routes/
        health.routes.ts
      types/
        apiError.ts
```

Verification:

- Run `npm install` if dependencies are added.
- Run `npm run typecheck`.
- Run `npm run build`.
- Optionally test `GET /health` and stop the server.
- Run `git status --short`.
- Confirm no `.env` with secrets exists.
- Confirm no build output is tracked.

Expected proposed commit message:

```text
feat(api): add backend API skeleton
```

Expected tag recommendation:
No tag yet.

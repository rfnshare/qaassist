# Prompt 0004 - Shared Contracts And Schemas

Goal:
Implement Step 0004: create shared contracts and schemas. This step should add a shared TypeScript package for stable cross-app types used by the extension, API, future Azure DevOps adapter, LLM gateway, and QA analysis engine. Do not implement Azure DevOps integration, LLM calls, database, auth, or QA analysis logic yet.

Preconditions:

- Step 0001 project foundation should already be committed.
- Step 0002 extension shell should already be committed.
- Step 0003 backend API skeleton should already be committed.
- Start from the latest approved branch state.
- Create or switch to branch: `feature/0004-shared-contracts`.
- Do not commit.
- Do not tag.

Product context:
QA Assist is a browser-extension-based embedded QA assistant for QA engineers. The first platform will be Azure DevOps Boards. The backend will eventually fetch work item data, normalize it into a generic work item context, send that context to the QA engine/LLM gateway, and return structured QA analysis to the extension. This step creates the shared contracts required before those integrations are built.

Important constraints:

- Do not implement Azure DevOps page detection yet.
- Do not implement Azure DevOps API fetch yet.
- Do not implement OAuth/PAT handling yet.
- Do not implement LLM provider calls yet.
- Do not implement QA analysis generation yet.
- Do not add database/storage.
- Do not store secrets.
- Do not add `.env` with real values.
- Preserve existing docs and project direction.
- Follow root `AGENTS.md`.
- Do not commit.
- Do not tag.

Technical direction:
Create a shared workspace package under `packages/shared`. Use TypeScript. Prefer type-first contracts with lightweight runtime validation only if practical and not too much dependency overhead. If adding a schema library, justify it clearly. Keep this step small, stable, and focused.

Tasks:

1. Inspect the existing repository files and read `AGENTS.md`, `README.md`, `docs/architecture.md`, `docs/auth-plan.md`, `docs/implementation-roadmap.md`, and `docs/git-workflow.md`.
2. Create or switch to branch `feature/0004-shared-contracts`.
3. Add shared package under `packages/shared`.
4. Update root workspace configuration so `packages/*` is included.
5. Add shared package files for package metadata, TypeScript config, and public exports.
6. Add contract files for API response/error, normalized work item context, QA analysis result, QA enums, test case types, source provider, and timestamps.
7. Define API response contracts: `ApiSuccess<T>`, `ApiFailure`, `ApiResponse<T>`, `ApiErrorBody`, and `ApiErrorCode`.
8. Define normalized work item contracts: `SourceProvider`, `WorkItemType`, `WorkItemContext`, `WorkItemComment`, `LinkedWorkItem`, and `AttachmentSummary`.
9. Ensure `WorkItemContext` supports source, organization, project, work item ID, URL, type, title, state, assigned user, paths, tags, text fields, comments, linked items, attachments, and capture timestamp.
10. Define QA analysis result contracts for requirement summary, questions, impacted areas, test scope, test cases, regression areas, automation candidates, and UAT notes.
11. Include unions for readiness, priority, risk level, automatable, question owner, test case type, and automation candidate type.
12. Add simple helper types such as `IsoDateTimeString`.
13. Export public contracts from `packages/shared/src/index.ts`.
14. Update API app to import API error types from `@qa-assist/shared` if practical.
15. Update extension app only if there is a clean low-risk use.
16. Add build/typecheck scripts for `@qa-assist/shared`.
17. Update root scripts so typecheck and build cover shared, API, and extension.
18. Update docs and store this prompt.
19. Keep generated files reasonable.
20. Ensure `.gitignore` excludes shared package build outputs if needed.

Preferred folder shape:

```text
packages/
  shared/
    package.json
    tsconfig.json
    src/
      index.ts
      api/
        apiError.ts
        apiResponse.ts
      common/
        sourceProvider.ts
        timestamps.ts
      work-items/
        workItemContext.ts
      qa/
        qaAnalysisResult.ts
        qaEnums.ts
        testCase.ts
```

Verification:

- Run `npm install` if workspace/package changes require it.
- Run `npm run typecheck`.
- Run `npm run build`.
- Run `git status --short`.
- Confirm no build output is tracked.
- Confirm no `.env` with secrets exists.

Expected proposed commit message:

```text
feat(shared): add shared contracts and schemas
```

Expected tag recommendation:
No tag yet.

# Step 0008 Prompt: Board/Work Summary Contracts

Goal: finalize Step 0007 if needed, then implement Step 0008 as an uncommitted review branch.

Branch:

```text
feature/0008-board-work-summary-contracts
```

Step 0008 adds shared TypeScript contracts for future Azure DevOps board summary, work queue, state mapping, current QA user settings, Azure Test Plans destination, board-wise knowledge files, and work recommendation logic.

This is a foundation step only.

## Do Not Implement

- Azure DevOps API fetch
- OAuth or PAT handling
- backend routes for board data
- LLM calls
- file upload
- Azure Test Plans write-back
- Playwright generation
- real board data
- UI fake counts
- database or storage

## Product Decisions

1. Azure is first.
2. Azure Test Plans is the first test management destination when Azure is configured.
3. Azure DevOps states should be configurable through settings.
4. Later, the app should fetch available states and let the user map them to In QA, Ready to Test, Resolved, Blocked, and Ready for UAT.
5. Current QA user can later come from Microsoft/Azure identity, configured QA user, assigned-to signal, or manual settings.
6. Board-wise knowledge/files are required because one user can work across multiple Azure boards.
7. QA Assist suggestions are not final. User confirmation is final.
8. Work recommendation should use explainable signals: priority, severity, story points, age, assignment, state, blocked status, release risk, and resolved bugs ready to retest.
9. No fake real data should appear in the UI.
10. Security and data handling must stay strong.

## Implementation Scope

Add shared contracts under `packages/shared/src`:

- `boards/boardSummary.ts`
- `boards/workQueue.ts`
- `settings/azureDevOpsSettings.ts`
- `settings/currentQaUser.ts`
- `test-management/testManagementSettings.ts`
- `knowledge/boardKnowledge.ts`
- `recommendations/workRecommendation.ts`

Update `packages/shared/src/index.ts` to export all public contracts.

Reuse existing shared types where practical:

- `SourceProvider`
- `WorkItemType`
- `IsoDateTimeString`
- `QaPriority`
- `QaRiskLevel`

Keep the shared package dependency-free and type-first.

## Documentation Scope

Update:

- `README.md`
- `docs/architecture.md`
- `docs/product-plan.md`
- `docs/azure-devops-settings-strategy.md`
- `docs/data-handling.md`
- `docs/implementation-roadmap.md`
- `docs/prompt-log.md`
- `docs/prompts/0008-board-work-summary-contracts.md`

The roadmap should mark Step 0008 as board/work summary contracts and make Azure board fetch the next step.

## Verification

Run:

```bash
npm run typecheck
npm run build
git ls-files apps/api/dist apps/extension/dist packages/shared/dist
Get-ChildItem -Recurse -Force -Filter '.env'
git status --short
git diff -- README.md docs/ packages/shared/ package.json package-lock.json apps/
```

Use intent-to-add for new files before final diff if needed.

## Required Sanity Checks

1. `packages/shared/src/index.ts` exports the new board/settings/recommendation/test-management/knowledge contracts.
2. Contracts support Azure DevOps first without blocking Jira/TestRail/Zephyr later.
3. State mapping categories include `in-qa`, `ready-to-test`, `resolved`, `blocked`, and `ready-for-uat`.
4. Work recommendation includes explainable signals and user confirmation.
5. Azure Test Plans is represented as the first test management provider.
6. Board-wise knowledge files are scoped to board/project context.
7. No runtime fetching, storage, or upload was added.

Proposed commit message:

```text
feat(shared): add board work summary contracts
```

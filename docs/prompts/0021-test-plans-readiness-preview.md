# Step 0021 Prompt: Azure Test Plans Readiness Preview

Goal: finalize Step 0020 if needed, then implement Step 0021: Azure Test Plans write-back readiness preview.

This step must not create anything in Azure, write back to Azure Test Plans, call LLMs, add extension-side keys, add PAT input, store secrets, persist reviewed cases beyond React/session state, silently approve generated cases, or mark anything ready by default.

Add shared contracts for `TestPlansReadinessMode`, `TestPlansReadinessStatus`, `TestPlansExportCandidate`, `TestPlansExportBlockedItem`, `TestPlansReadinessWarning`, `TestPlansReadinessRequest`, `TestPlansReadinessResult`, and `TestPlansTargetSettings`.

Add backend `POST /test-plans/readiness/preview` with validation for missing body, missing `reviewSession`, missing `targetSettings`, required target `organization`, `project`, and `team`, and `reviewSession.reviewedCases` as an array. Only reviewed cases with status `approved-for-export`, `approvedByUser: true`, `readyForExport: true`, evidence links, reviewed steps, reviewed title, and reviewed expected result can become candidates. Other cases become blocked items with reasons. Missing plan/suite settings should return `needs-settings` when candidates exist. Ready candidates with plan and suite should return `ready-for-confirmation`.

Update extension Settings > Test Management with non-secret optional Azure Test Plan ID, Azure Test Suite ID, default area path, and default iteration path. Add an API client method for the backend preview route. In Story review UI, after review validation succeeds, show an Azure Test Plans readiness preview section with status, target settings, candidates, blocked items, warnings, required confirmations, and disclaimer. Copy must clearly state: preview only, nothing will be created in Azure, actual creation is not implemented, and approved for export only means eligible for a future final confirmation step.

Reset readiness preview when story detail changes, analysis reruns, draft cases regenerate, review session changes, page context changes, or target settings change.

Update README, UX workflow, data handling, security foundation, hallucination guardrails, implementation roadmap, prompt log, and this prompt file.

Verification must include typecheck, build, generated dist tracking check, `.env` search, git status/diff, and safe API tests for readiness validation, candidate/blocked behavior, existing related routes, and no Azure/LLM/write-back behavior.

Do not commit Step 0021. Do not create Git tags. Proposed commit message: `feat(test-plans): add readiness preview`.

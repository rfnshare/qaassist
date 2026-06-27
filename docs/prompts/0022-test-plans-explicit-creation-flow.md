# Step 0022 Prompt: Azure Test Plans Explicit Creation Flow

Goal: finalize Step 0021 if needed, then implement Step 0022: Azure Test Plans explicit creation approval flow.

This step may create Azure Test Plans test cases, but only through a strict backend-mediated explicit confirmation flow. It must not silently write back, create items during preview, create every reviewed case by default, call LLMs, add extension-side keys, add PAT input, store secrets, commit `.env`, create test plans or suites, update Azure work items, create bugs, add automation repo integration, or persist created review sessions beyond React/session state.

Add shared contracts for explicit creation: `TestPlansCreationMode`, `TestPlansCreationCandidateSelection`, `TestPlansCreationRequest`, `TestPlansCreationResult`, `TestPlansCreatedItem`, `TestPlansCreationFailure`, `TestPlansCreationStatus`, and `TestPlansCreationConfirmation`.

Add backend Azure Test Plans client/service and `POST /test-plans/create`. The route must validate body, readiness result, selected candidate IDs, final confirmation, readiness status `ready-for-confirmation`, selected IDs existing in readiness candidates, target organization/project/team/testPlanId/testSuiteId, and absence of secrets in the request body. Missing backend PAT must return a safe 503 if the live creation path is reached.

Creation must create only explicitly selected candidates, not blocked or non-selected items. Map reviewed fields conservatively into Azure Test Case payloads with title, steps, and expected result. Return created, failed, and skipped item results. Do not update story links in this step.

Update extension API client with `createTestPlansCases(apiBaseUrl, input)`. In the Story readiness preview UI, show candidate selection after readiness succeeds, select no candidates by default, require a final confirmation checkbox, and enable `Create selected in Azure Test Plans` only when readiness is ready, at least one candidate is selected, and confirmation is checked. Render created, failed, skipped, and overall status after creation.

Update README, UX workflow, data handling, security foundation, hallucination guardrails, implementation roadmap, prompt log, and this prompt file.

Verification must include typecheck, build, generated dist tracking check, `.env` search, git status/diff, safe API tests, and manual UI sanity notes.

Do not commit Step 0022. Do not create Git tags. Proposed commit message: `feat(test-plans): add explicit creation flow`.

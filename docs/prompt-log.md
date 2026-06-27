# Prompt Log

Every implementation step should store the task prompt under `docs/prompts/`.

The prompt file should include enough detail for a future contributor or agent to understand the goal, branch, constraints, tasks, verification expectations, and expected final response format.

Use filenames that match the implementation step:

```text
docs/prompts/0001-project-foundation.md
docs/prompts/0002-extension-shell.md
docs/prompts/0003-api-skeleton.md
docs/prompts/0007-simplified-ui-dark-mode.md
docs/prompts/0008-board-work-summary-contracts.md
docs/prompts/0009-azure-devops-settings-board-summary-fetch.md
docs/prompts/0010-azure-preview-validation-today-ui.md
docs/prompts/0011-seamless-azure-setup-configuration.md
docs/prompts/0012-azure-connection-team-discovery.md
docs/prompts/0013-ai-board-briefing-foundation.md
docs/prompts/0014-azure-work-item-detail-story-workspace.md
docs/prompts/0015-story-requirement-gap-analysis.md
docs/prompts/0016-board-knowledge-foundation.md
docs/prompts/0017-safe-file-extraction-foundation.md
docs/prompts/0018-knowledge-evidence-story-analysis.md
docs/prompts/0019-test-case-draft-generation.md
docs/prompts/0020-test-case-review-workflow.md
docs/prompts/0021-test-plans-readiness-preview.md
docs/prompts/0022-test-plans-explicit-creation-flow.md
docs/prompts/0023-backend-llm-provider-adapter.md
docs/prompts/0024-automation-candidate-mapping.md
docs/prompts/0025-export-package-review-output.md
docs/prompts/0026-story-bug-writeback-helpers.md
docs/prompts/0027-ai-assisted-refinement-rollout.md
```

If the prompt changes during implementation, keep the stored prompt faithful to the final requested task and note material differences in the final response.

## Entries

- `0001-project-foundation`: project foundation and documentation.
- `0002-extension-shell`: Chrome/Edge Manifest V3 extension shell with right-side panel placeholders.
- `0003-api-skeleton`: Fastify TypeScript backend skeleton with health endpoint, config loading, CORS, and structured errors.
- `0004-shared-contracts`: shared TypeScript contracts for API responses, work item context, and QA analysis output.
- `0005-azure-devops-page-detection`: extension URL-only detection for Azure DevOps work item pages.
- `0006-product-replan-qa-cockpit-ui`: product replan, security foundation docs, and premium QA cockpit UI shell.
- `0007-simplified-ui-dark-mode`: simplified four-section side panel UI, dark mode, one-primary-action layout, and calm preview states.
- `0008-board-work-summary-contracts`: shared contracts for board summaries, work queues, Azure DevOps settings, current QA user, Azure Test Plans, board knowledge, and work recommendations.
- `0009-azure-devops-settings-board-summary-fetch`: backend-only Azure DevOps PAT config, read-only states and board summary preview routes, extension non-secret Azure settings, and Today board summary fetch.
- `0010-azure-preview-validation-today-ui`: manual Azure preview validation guide, mapper resilience refinement, and calmer Today/Settings UI for real board preview data.
- `0011-seamless-azure-setup-configuration`: product-grade Azure connection shell, selected team board setup, full configuration placeholders, and AI board briefing direction without OAuth, LLM calls, uploads, automation, or write-back.
- `0012-azure-connection-team-discovery`: backend URL parsing, read-only Azure project/team discovery routes, extension setup flow wiring, and selected team board discovery without OAuth, write-back, LLM calls, uploads, or PAT storage in the extension.
- `0013-ai-board-briefing-foundation`: shared board briefing contracts, deterministic backend evidence-bound briefing generation, Today briefing UI, and docs for future backend-mediated LLM support without provider calls or write-back.
- `0014-azure-work-item-detail-story-workspace`: shared work item detail contracts, backend read-only Azure work item detail fetch route, extension API client integration, Story workspace source-backed detail UI, and docs without LLM analysis, write-back, PAT storage, comments, bug creation, or generated test cases.
- `0015-story-requirement-gap-analysis`: shared Story requirement analysis contracts, deterministic backend evidence-bound analysis route, extension Story analysis UI, and docs without LLM calls, write-back, PAT storage, generated test cases, or fake story data.
- `0016-board-knowledge-foundation`: board knowledge metadata contracts, metadata-only backend validation/summary routes, Settings metadata-only UI, and docs without file content upload/parsing/indexing, LLM calls, write-back, or fake documents.
- `0017-safe-file-extraction-foundation`: shared extraction contracts, backend `.txt`/`.md` extraction policy and JSON preview route, Settings manual-paste extraction preview UI, and docs without multipart upload, storage, indexing, LLM ingestion, Story analysis linkage, or write-back.
- `0018-knowledge-evidence-story-analysis`: explicit user-selected board knowledge evidence linking for deterministic Story analysis, evidence coverage output, metadata/extraction preview warnings, and docs without automatic indexing, LLM calls, full document persistence, generated test cases, or write-back.
- `0019-test-case-draft-generation`: deterministic test case draft contracts, backend draft generation route, Story draft UI, evidence links, warnings, and docs without LLM calls, Azure Test Plans creation, final test case approval, persistence, or write-back.
- `0020-test-case-review-workflow`: local/session review and edit workflow for generated test case drafts, backend review normalization, explicit approve/reject/block decisions, and docs without Azure Test Plans creation, LLM calls, persistence, or write-back.
- `0021-test-plans-readiness-preview`: Azure Test Plans readiness contracts, backend preview route, non-secret target settings, and Story readiness UI for validated reviewed cases without Azure calls, write-back, LLM calls, persistence, or silent approval.
- `0022-test-plans-explicit-creation-flow`: backend-mediated Azure Test Plans creation for explicitly selected readiness candidates after final confirmation, with created/failed/skipped results and docs without silent write-back, story linking, LLM calls, PAT storage, or persistence.
- `0023-backend-llm-provider-adapter`: optional backend-only LLM provider status and Story assist route, Settings provider status UI, and separate AI-assisted suggestions without extension secrets, mandatory LLM use, write-back, persistence, or deterministic flow replacement.
- `0024-automation-candidate-mapping`: deterministic automation candidate mapping from validated reviewed cases with readiness, reasons, blockers, and planning-only UI without Playwright generation, repo writes, CI/CD changes, LLM calls, or persistence.
- `0025-export-package-review-output`: portable Markdown/JSON review package export from selected current-session sections with trust labels and copy/download UI without external writes, secrets, LLM calls, repo writes, or persistence.
- `0026-story-bug-writeback-helpers`: preview-only bug, comment, state transition, and attachment metadata helpers with warnings and required confirmations without Azure DevOps writes, LLM calls, secret handling, or persistence.
- `0027-ai-assisted-refinement-rollout`: optional backend-only AI refinement across Story analysis, draft cases, automation mapping, and write-back helper previews without deterministic replacement, auto-apply, external writes, extension secrets, or persistence.

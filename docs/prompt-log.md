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

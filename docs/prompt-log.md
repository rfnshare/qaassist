# Prompt Log

Every implementation step should store the task prompt under `docs/prompts/`.

The prompt file should include enough detail for a future contributor or agent to understand the goal, branch, constraints, tasks, verification expectations, and expected final response format.

Use filenames that match the implementation step:

```text
docs/prompts/0001-project-foundation.md
docs/prompts/0002-extension-shell.md
docs/prompts/0003-api-skeleton.md
```

If the prompt changes during implementation, keep the stored prompt faithful to the final requested task and note material differences in the final response.

## Entries

- `0001-project-foundation`: project foundation and documentation.
- `0002-extension-shell`: Chrome/Edge Manifest V3 extension shell with right-side panel placeholders.
- `0003-api-skeleton`: Fastify TypeScript backend skeleton with health endpoint, config loading, CORS, and structured errors.
- `0004-shared-contracts`: shared TypeScript contracts for API responses, work item context, and QA analysis output.
- `0005-azure-devops-page-detection`: extension URL-only detection for Azure DevOps work item pages.
- `0006-product-replan-qa-cockpit-ui`: product replan, security foundation docs, and premium QA cockpit UI shell.

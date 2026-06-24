# QA Assist

QA Assist is an embedded QA assistant for QA engineers. The first vehicle is a Chrome/Edge browser extension that opens a right-side assistant panel beside an Azure DevOps Boards work item.

The first workflow is feature/story QA analysis. QA Assist should help a QA engineer understand a story, find ambiguity, identify impacted areas, prepare manual test scope, draft test cases, mark automation candidates, and prepare UAT handoff notes without leaving the work item page.

## MVP Scope

- Browser extension first.
- Azure DevOps Boards / Work Items first.
- Right-side assistant panel experience.
- Feature/story QA analysis workflow.
- Structured output for requirement questions, impacted areas, test scope, test cases, regression scope, automation candidates, and UAT notes.
- Small backend API from an early stage.
- Backend-mediated LLM gateway for production architecture.
- Azure DevOps adapter that normalizes work item data into shared contracts.

## Non-Goals

- Production incident workflow.
- Jira support.
- TestRail or Zephyr integration.
- Full Playwright code generation.
- Reusing Codex, ChatGPT, VS Code, or browser session tokens.
- Standalone HTML product direction.

## Planned Architecture

QA Assist will use a browser extension for the embedded user experience, a small backend API for integrations and LLM mediation, an Azure DevOps adapter for work item context, shared schemas for data contracts, and a QA analysis engine that returns validated structured output.

```text
Browser Extension
  -> Backend API
  -> Azure DevOps Adapter
  -> LLM Gateway
  -> QA Analysis Engine
  -> Shared Schemas
```

## Current Status

Step 0006 product replan, security foundation, and QA cockpit UI shell is implemented for review. The repository now contains a Chrome Manifest V3 extension under `apps/extension`, a Fastify TypeScript backend skeleton under `apps/api`, and shared TypeScript contracts under `packages/shared`.

Azure DevOps URL-only work item detection exists in the extension. The side panel now presents a QA command center and workflow cockpit. Azure DevOps board fetch, Azure Test Plans, auth, LLM calls, file upload, database/storage, and QA analysis logic are intentionally not implemented yet.

## Local Development

Install dependencies:

```bash
npm install
```

Build the extension shell:

```bash
npm run build
```

Typecheck the extension shell:

```bash
npm run typecheck
```

Run the API locally:

```bash
npm run dev:api
```

Build only the API:

```bash
npm run build:api
```

Typecheck only the API:

```bash
npm run typecheck:api
```

The root `npm run build` and `npm run typecheck` commands cover the shared package, API, and extension workspaces.

API environment defaults are documented in `.env.example`. Keep real values in local `.env` files only.

Load the unpacked extension locally:

1. Run `npm run build`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode.
4. Click `Load unpacked`.
5. Select `apps/extension/dist`.

Test the QA cockpit and Azure DevOps page detection locally:

1. Load the unpacked extension from `apps/extension/dist`.
2. Open a supported Azure DevOps work item URL, for example `https://dev.azure.com/my-org/my-project/_workitems/edit/12345`.
3. Open the QA Assist side panel.
4. Inspect the `Command Center` and `Story Workspace` sections.
5. Confirm the organization, project, work item ID, URL, and detection timestamp are shown.
6. Board/work counts are preview placeholders until the Azure DevOps board fetch step is implemented.

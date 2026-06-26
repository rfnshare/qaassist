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

Step 0019 deterministic test case draft generation is implemented for review. The repository contains a Chrome Manifest V3 extension under `apps/extension`, a Fastify TypeScript backend under `apps/api`, and shared TypeScript contracts under `packages/shared`.

Azure DevOps URL-only work item detection exists in the extension. The side panel uses a calm, small-window-friendly four-section flow: Today, Story, Run, and Settings. Settings starts with an Azure DevOps Services or TFS URL, checks the connection through the backend, discovers Azure DevOps Services projects and team boards, and keeps manual setup under advanced local preview. Settings now includes a metadata-only Board Knowledge shell scoped to the selected team board. Today can request a read-only board condition preview and then generate an evidence-bound deterministic QA briefing from that returned board data. Story can request read-only Azure work item detail through the backend and generate a deterministic evidence-bound requirement/gap analysis from the fetched detail.

The Azure DevOps PAT remains a local development backend-only fallback and is never requested by the extension. The product direction is seamless Azure/Microsoft auth later through Microsoft Entra/OAuth. The current board briefing, Story requirement analysis, and test case drafts are deterministic preview logic, not LLM calls. Board knowledge supports metadata plus a backend JSON-only extraction preview for manually pasted `.txt` and `.md` text. Story analysis can include only user-selected board knowledge metadata, capped extraction preview evidence, or a short user-confirmed note. Test case drafts are generated from available evidence only and require QA review before use. Board knowledge is not automatically indexed or linked. Azure Test Plans write-back, OAuth, database/storage, comments, bug creation, final approved test cases, and automation generation are intentionally not implemented yet.

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

For local Azure DevOps board summary preview, copy `.env.example` to a local `.env` for the API process and set:

```bash
AZURE_DEVOPS_PAT=your-local-dev-pat
AZURE_DEVOPS_API_VERSION=7.1
AZURE_DEVOPS_REQUEST_TIMEOUT_MS=10000
```

Do not put PATs or tokens into the extension Settings panel.

Load the unpacked extension locally:

1. Run `npm run build`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode.
4. Click `Load unpacked`.
5. Select `apps/extension/dist`.

Test the simplified QA Assist side panel and Azure DevOps page detection locally:

1. Load the unpacked extension from `apps/extension/dist`.
2. Open a supported Azure DevOps work item URL, for example `https://dev.azure.com/my-org/my-project/_workitems/edit/12345`.
3. Open the QA Assist side panel.
4. Review the `Today`, `Story`, `Run`, and `Settings` sections.
5. Confirm the `Story` section shows the organization, project, work item ID, URL, and detection timestamp.
6. In `Story`, click `Fetch story details` and confirm details appear only after the backend call succeeds.
7. Optionally select linked board knowledge evidence in Story, then click `Analyze requirements` and confirm the output is labeled `Evidence-bound preview`.
8. Confirm evidence coverage, linked evidence, gaps/questions, and likely test areas are clearly non-final and need confirmation.
9. Generate draft test cases and confirm they are labeled draft-only with evidence links and warnings.
10. Confirm description, acceptance criteria, and linked extraction previews display as safe text previews, not executable HTML.
11. In `Settings`, test `System`, `Light`, and `Dark` theme modes.
11. In `Settings`, enter an Azure DevOps Services or TFS URL and click `Connect`.
12. Select a discovered project and team board, or use advanced local preview only when discovery cannot run in local development.
13. In `Settings`, add a Board Knowledge metadata-only source and confirm the file selector captures metadata only.
14. Paste `.txt` or `.md` text into Extraction preview and confirm the backend returns status, evidence, warnings, and preview text without storing or indexing it.
15. In `Today`, click `Fetch board condition`.
16. Click `Generate QA briefing` after the board condition fetch succeeds.
17. Confirm real counts, story details, analysis, board knowledge metadata, extraction preview, and briefing claims only appear after successful backend calls. If backend PAT is missing, the UI should show `Azure DevOps backend token is not configured. Add it to local .env on the API server.`

Manual Azure preview validation steps are documented in `docs/manual-tests/0010-azure-preview-validation.md`.
Configuration experience direction is documented in `docs/configuration-experience.md`, and the future AI board briefing direction is documented in `docs/ai-board-briefing.md`.

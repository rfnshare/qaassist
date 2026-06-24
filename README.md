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

Project foundation is being created. No runtime extension, backend, Azure DevOps integration, or LLM implementation exists yet.

## Local Development

Runtime commands will be added when the extension and backend skeletons are introduced.

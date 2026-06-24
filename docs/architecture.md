# Architecture

## Target Architecture

QA Assist is planned as an extension plus backend system with shared contracts between components.

```text
Browser Extension
  -> Backend API
  -> Azure DevOps Adapter
  -> LLM Gateway
  -> QA Engine
  -> Shared Schemas
```

## Browser Extension

The extension provides the embedded right-side assistant panel. It detects supported Azure DevOps work item pages, displays setup and analysis states, and sends requests to the backend.

Initial shell module structure:

```text
apps/extension/
  public/
    manifest.json
  src/
    background/
      index.ts
    content/
      index.ts
    shared/
      extensionMessages.ts
    sidepanel/
      App.tsx
      main.tsx
      styles.css
      components/
```

The shell currently includes a side panel UI, background service worker, content script placeholder, and static Manifest V3 configuration. It does not detect Azure DevOps pages, call backend APIs, call LLM providers, or render real QA analysis yet.

## Backend API

The backend mediates calls to Azure DevOps and LLM providers. It is responsible for config loading, auth flow handling, request validation, structured error responses, and privacy boundaries.

## Azure DevOps Adapter

The Azure DevOps adapter fetches work item data and normalizes platform-specific fields into shared work item contracts. Azure DevOps is the first adapter; Jira and other tools are later possibilities.

## LLM Gateway

The LLM gateway abstracts provider-specific calls. Production architecture should avoid storing LLM secrets in the extension. The gateway should support mock providers for deterministic development and testing.

## QA Engine

The QA engine converts normalized work item context into structured QA analysis. It should use prompt templates, schema validation, and Markdown rendering.

## Shared Schemas

Shared schemas define the contracts for work item context, comments, attachments, linked work items, QA analysis results, questions, test cases, regression scope, automation candidates, and UAT notes.

## Boundaries

- Extension UI should not contain provider-specific LLM logic.
- Azure DevOps extraction should not be hardcoded into the QA analysis engine.
- Story content and tokens should not be persisted unless explicitly designed and approved later.

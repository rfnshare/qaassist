# Architecture

## Target Architecture

QA Assist is planned as an extension plus backend system with shared contracts between components. The product is Azure-first and adapter-based, so later providers can reuse the same normalized contracts.

```text
Browser Extension
  -> Backend API
  -> Board/Knowledge Boundary
  -> Azure DevOps Adapter
  -> Azure Test Plans Adapter
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

The shell currently includes a side panel UI, background service worker, content script placeholder, static Manifest V3 configuration, local non-secret Azure settings, and a Today action that calls the backend for a read-only board summary preview. It does not call LLM providers or render real QA analysis yet.

Azure DevOps page detection module structure:

```text
apps/extension/
  src/
    adapters/
      azureDevOpsPageAdapter.ts
```

The Step 0005 extension detection boundary is URL-only. It parses supported Azure DevOps work item URLs and sends safe page context to the side panel: source, organization, project, work item ID, work item URL, and detection timestamp. It does not scrape story text, fetch Azure DevOps APIs, call the backend, perform auth, or call an LLM.

Step 0009 keeps the simplified Today, Story, Run, and Settings flow. Settings stores only non-secret local values. Today fetches real board summary data only through the backend when the API and Azure DevOps PAT are configured.

## Backend API

The backend mediates calls to Azure DevOps and LLM providers. It is responsible for config loading, auth flow handling, request validation, structured error responses, and privacy boundaries.

Initial backend skeleton module structure:

```text
apps/api/
  src/
    app.ts
    server.ts
    config/
      env.ts
    plugins/
      cors.ts
      errorHandler.ts
    routes/
      health.routes.ts
    types/
      apiError.ts
```

The API currently includes `GET /`, `GET /health`, environment variable parsing, development CORS, request IDs, structured error responses, and read-only Azure DevOps preview routes under `/azure-devops`. The PAT is read from backend environment only and is never returned to the extension. OAuth, LLM providers, database/storage, write-back, and QA analysis orchestration are not implemented yet.

## Azure DevOps Adapter

The Azure DevOps adapter fetches work item data and normalizes platform-specific fields into shared work item contracts. Azure DevOps is the first adapter; Jira and other tools are later possibilities.

Step 0009 adds backend-only read operations for Azure DevOps states and board summary preview. The preview uses WIQL to find candidate work item IDs, Work Items Batch to fetch selected fields, and mappers to produce `BoardSummary`, `QaWorkQueue`, and `WorkRecommendation` contracts.

## LLM Gateway

The LLM gateway abstracts provider-specific calls. Production architecture should avoid storing LLM secrets in the extension. The gateway should support mock providers for deterministic development and testing.

## QA Engine

The QA engine converts normalized work item context into structured QA analysis. It should use prompt templates, schema validation, and Markdown rendering.

## Shared Schemas

Shared schemas define the contracts for work item context, comments, attachments, linked work items, QA analysis results, questions, test cases, regression scope, automation candidates, UAT notes, board summaries, work queues, settings, board knowledge, and work recommendations.

Initial shared package structure:

```text
packages/shared/
  src/
    api/
      apiError.ts
      apiResponse.ts
    boards/
      boardSummary.ts
      workQueue.ts
    common/
      sourceProvider.ts
      timestamps.ts
    knowledge/
      boardKnowledge.ts
    qa/
      qaAnalysisResult.ts
      qaEnums.ts
      testCase.ts
    recommendations/
      workRecommendation.ts
    settings/
      azureDevOpsSettings.ts
      currentQaUser.ts
    test-management/
      testManagementSettings.ts
    work-items/
      workItemContext.ts
```

The package currently provides type-first contracts for API responses, normalized work item context, QA analysis results, QA questions, impacted areas, test scope, test cases, regression scope, automation candidates, UAT handoff notes, board summaries, work queues, Azure DevOps settings, current QA user settings, Azure Test Plans destination settings, board-scoped knowledge files, and explainable work recommendations. Runtime validation schemas are intentionally deferred until the contracts are reviewed against the Azure DevOps adapter needs.

## Boundaries

- Extension UI should not contain provider-specific LLM logic.
- Azure DevOps extraction should not be hardcoded into the QA analysis engine.
- Azure DevOps PATs stay server-side only and must not be stored in extension settings.
- Story content and tokens should not be persisted unless explicitly designed and approved later.
- Step 0005 Azure DevOps detection is limited to supported URLs and safe metadata.
- Board files and requirement memory must be board-scoped when implemented.
- All write-back operations require explicit user approval.

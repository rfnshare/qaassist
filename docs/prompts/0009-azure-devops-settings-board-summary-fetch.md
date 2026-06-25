# Step 0009 Prompt: Azure DevOps Settings And Board Summary Fetch

Goal: finalize Step 0008 if needed, then implement Step 0009 as an uncommitted review branch.

Branch:

```text
feature/0009-azure-devops-settings-board-summary-fetch
```

Implement the first real Azure DevOps read integration for local/dev use:

- Backend-only Azure DevOps PAT configuration.
- Fetch Azure DevOps work item states.
- Fetch a board/work summary using WIQL and Work Items Batch.
- Add a simple extension settings flow for Azure organization, project, team, current QA user, and API base URL.
- Add a Today screen action to fetch and display real board summary only when backend and Azure config are available.

This step is read-only.

## Do Not Implement

- OAuth
- production auth
- Azure Test Plans write-back
- comments or write-back
- bug creation
- LLM calls
- file upload
- database persistence
- Playwright generation
- automation repo access
- token storage in the extension

## Security Rules

1. Azure DevOps PAT must stay server-side only.
2. Do not add a real `.env`.
3. Do not log PATs, authorization headers, cookies, or secrets.
4. Do not expose PAT or auth headers to the extension.
5. Do not store raw board/story data by default.
6. Do not write anything to Azure DevOps.
7. If Azure config is missing, return a safe configuration error.
8. Keep host permissions narrow.
9. Keep all UI real-data labels honest.
10. Do not show fake board counts as real data.

## Product Behavior

- Settings panel stores non-secret local settings only.
- API base URL defaults to `http://127.0.0.1:4317`.
- Settings panel must not ask for PAT.
- Backend `.env` contains PAT locally for development only.
- Today panel primary action is `Fetch board summary`.
- If settings are missing, Today asks the user to complete Settings.
- If backend PAT is missing, show: `Azure DevOps backend token is not configured. Add it to local .env on the API server.`
- If data is fetched successfully, show real counts and real work items.
- If data is not fetched, keep placeholders clearly labeled.
- Story panel URL detection from Step 0005 must keep working.

## Backend Scope

Add `.env.example` placeholders:

- `AZURE_DEVOPS_PAT=`
- `AZURE_DEVOPS_API_VERSION=7.1`
- `AZURE_DEVOPS_REQUEST_TIMEOUT_MS=10000`

Add backend-only Azure DevOps integration files:

- `apps/api/src/integrations/azure-devops/azureDevOpsClient.ts`
- `apps/api/src/integrations/azure-devops/azureDevOpsConfig.ts`
- `apps/api/src/integrations/azure-devops/azureDevOpsErrors.ts`
- `apps/api/src/integrations/azure-devops/azureDevOpsMappers.ts`
- `apps/api/src/integrations/azure-devops/azureDevOpsState.service.ts`
- `apps/api/src/integrations/azure-devops/azureDevOpsBoardSummary.service.ts`
- `apps/api/src/routes/azureDevOps.routes.ts`

Routes:

- `GET /azure-devops/states`
- `POST /azure-devops/board-summary/preview`

Use Azure DevOps REST API version `7.1` unless config overrides it.

## Verification

Run:

```bash
npm run typecheck
npm run build
git ls-files apps/api/dist apps/extension/dist packages/shared/dist
Get-ChildItem -Recurse -Force -Filter '.env'
git status --short
git diff -- README.md .env.example docs/ apps/ packages/shared/ package.json package-lock.json
```

Step 0009 must remain uncommitted for review.

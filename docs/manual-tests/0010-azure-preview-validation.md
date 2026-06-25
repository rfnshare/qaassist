# Step 0010 Manual Azure Preview Validation

This guide validates the read-only Azure DevOps board summary preview without exposing secrets or private work item details.

## Local API Environment

Create a local API `.env` from the example file:

```powershell
Copy-Item .env.example .env
```

Set only local development values in `.env`:

```text
API_HOST=127.0.0.1
API_PORT=4317
EXTENSION_ORIGIN=chrome-extension://replace-after-local-install
NODE_ENV=development
AZURE_DEVOPS_PAT=your-local-dev-pat
AZURE_DEVOPS_API_VERSION=7.1
AZURE_DEVOPS_REQUEST_TIMEOUT_MS=10000
```

Do not commit `.env`. Do not paste PATs, Authorization headers, cookies, or full private work item details into shared logs.

## PAT Scope

Use the least-privilege Azure DevOps PAT scope needed for read-only work item access. For local validation, use read access for Work Items. Do not grant write scopes.

## Start The API

```powershell
npm run dev:api
```

## Health Check

```powershell
Invoke-RestMethod http://127.0.0.1:4317/health
```

Expected: `status` is `ok`.

## Fetch States

Replace organization and project with local values. Redact them before sharing logs.

```powershell
Invoke-RestMethod "http://127.0.0.1:4317/azure-devops/states?organization=YOUR_ORG&project=YOUR_PROJECT"
```

Expected: state options grouped by work item type. If PAT is missing, expect:

```text
Azure DevOps backend token is not configured. Add it to local .env on the API server.
```

## Fetch Board Summary Preview

```powershell
$body = @{
  selectedBoard = @{
    source = "azure-devops"
    organization = "YOUR_ORG"
    project = "YOUR_PROJECT"
    iterationPath = "OPTIONAL_ITERATION_PATH"
  }
  currentQaUser = @{
    displayName = "OPTIONAL_QA_NAME"
    email = "OPTIONAL_QA_EMAIL"
    source = "configured-user"
    isOverride = $true
  }
  maxItems = 100
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:4317/azure-devops/board-summary/preview" `
  -ContentType "application/json" `
  -Body $body
```

Expected successful preview:

- `boardSummary` is returned.
- `workQueue` is returned.
- `recommendation` may be returned when candidate work exists.
- Counts reflect real returned Azure DevOps data.
- No write-back occurs.

## Expected Validation Errors

Missing `selectedBoard` should return `VALIDATION_ERROR`.

Missing `selectedBoard.organization` should return `VALIDATION_ERROR`.

Invalid `maxItems` such as `0`, negative numbers, decimals, strings, or non-finite values should return `VALIDATION_ERROR`.

## Extension Today Panel

1. Build the extension with `npm run build`.
2. Load `apps/extension/dist` in Chrome extensions developer mode.
3. Open QA Assist.
4. In Settings, configure API base URL, Azure organization, Azure project, optional team/iteration, and optional current QA user.
5. Confirm there is no PAT input.
6. Open Today.
7. Click `Fetch board summary`.
8. Verify fetched board/project, fetched timestamp, source/freshness label, metrics, state buckets, My QA work, Resolved bugs ready to retest, and Suggested next work.
9. Confirm empty states are calm and do not show fake counts.

## Sharing Results Safely

When sharing validation results, redact private organization, project, board, iteration, people, and work item titles. Prefer sharing:

- number of items fetched
- state bucket counts
- whether My QA work matched
- whether recommendation was produced
- any field mapping problems

Never share PATs, Authorization headers, cookies, or full private story text.

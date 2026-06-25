# Step 0012 Prompt: Azure Connection And Team Discovery

Implement Step 0012 on `feature/0012-azure-connection-team-discovery` after confirming Step 0011 is committed and merged into `develop`.

## Goal

Add read-only Azure setup discovery so QA Assist users can enter an Azure DevOps Services or Team Foundation Server URL, connect through the backend, discover projects, discover team boards, select a team board, and see `Selected Team: {organization}/{project}/{team}`.

## Constraints

- Do not implement OAuth or Microsoft Entra auth yet.
- Keep the local/dev backend PAT fallback.
- Do not add PAT input to the extension.
- Do not store PAT in the extension.
- Do not print PAT or Authorization headers.
- Do not commit `.env`.
- Do not add write-back routes, LLM calls, file upload, Azure Test Plans write-back, automation repo integration, or database persistence.
- Do not show fake real data.
- Keep all Azure DevOps calls read-only and backend-mediated.
- Preserve dark mode, Story URL detection, and Today board preview fetch.

## Implementation Scope

- Add backend URL parsing for `dev.azure.com`, legacy `visualstudio.com`, and HTTPS TFS collection URL shapes.
- Add backend setup routes under `/azure-devops/setup` for connect, projects, and teams.
- Add read-only Azure DevOps Services discovery using `_apis/projects` and `_apis/projects/{project}/teams`.
- Keep TFS discovery as parsed placeholder with warning.
- Add shared setup/discovery contracts.
- Add an extension API client for setup and board preview calls.
- Wire Settings to connect, list projects, list teams, select team board, and keep advanced local preview fallback.
- Keep Today setup-first and selected-team behavior.
- Update docs and roadmap.

## Verification

Run:

```bash
npm run typecheck
npm run build
git ls-files apps/api/dist apps/extension/dist packages/shared/dist
Get-ChildItem -Recurse -Force -Filter '.env'
git status --short
git diff -- README.md docs/ apps/ packages/shared/ package.json package-lock.json .env.example
```

Safe API tests should cover `/health`, invalid setup URL, unsupported `http:` setup URL, valid Azure DevOps Services setup URL without PAT, and existing board summary preview missing-token behavior.

Do not commit Step 0012 unless explicitly asked.

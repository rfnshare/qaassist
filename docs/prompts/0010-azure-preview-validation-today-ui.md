# Step 0010 Prompt: Azure Preview Validation And Today UI Refinement

Goal: implement Step 0010 from `develop` on branch:

```text
feature/0010-azure-preview-validation-today-ui
```

Step 0010 validates and refines the Azure DevOps board summary preview and Today UI while keeping everything read-only and secure.

## Constraints

- Keep Azure DevOps PAT backend-only.
- Do not store PAT in the extension.
- Do not add PAT input to the extension UI.
- Do not print PAT or Authorization headers.
- Do not commit `.env`.
- Do not add write-back routes.
- Do not add LLM calls.
- Do not add database persistence.
- Do not store raw board/story data by default.
- Do not show fake data.
- Do not add Azure Test Plans write-back, bug creation, file upload, or Playwright generation.
- All Azure DevOps interactions remain read-only.
- User confirmation remains final for any future recommendation.

## Tasks

1. Add `docs/manual-tests/0010-azure-preview-validation.md`.
2. Improve backend mapper resilience where needed.
3. Keep WIQL project-scoped, optional iteration-scoped, read-only, capped, and escaped.
4. Refine Today UI for real board data.
5. Refine Settings copy so PAT remains clearly server-side only.
6. Add tiny helpers for title truncation, date formatting, metric formatting, and response handling if useful.
7. Update README, roadmap, prompt log, manual test guide, and this prompt file.

## Safe API Tests

Run in-process or local API tests:

1. `/health` returns 200.
2. Missing `selectedBoard` returns 400.
3. Missing organization returns 400.
4. Invalid `maxItems` returns 400.
5. Valid selected board with no PAT returns safe 503.
6. `/azure-devops/states` with valid organization/project and no PAT returns safe 503.
7. No secrets printed.

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

Step 0010 must remain uncommitted for review.

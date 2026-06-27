# 0025 Export Package Review Output

Implement Step 0025 from `develop` on `feature/0025-export-package-review-output`.

Goal: package current QA Assist Story session output into a portable export artifact for handoff, review, attachment, or archive without mutating external systems.

Required implementation:

- Add shared export contracts under `packages/shared/src/export/reviewExport.ts`.
- Add backend route `POST /export/review-package`.
- Support `json` and `markdown` formats.
- Support selected sections:
  - `story-context`
  - `story-analysis`
  - `ai-assist`
  - `draft-cases`
  - `review-session`
  - `test-plans-readiness`
  - `test-plans-creation`
  - `automation-candidates`
- Validate missing body, invalid format, invalid/empty sections, and secret-like request keys.
- Generate a portable artifact with file name, MIME type, content, included section summary, warnings, and disclaimer.
- Skip unavailable selected sections with warnings when other selected data is available.
- Add Story UI for format selection, section toggles, export generation, warnings, file name, preview, copy, and browser download.

Safety requirements:

- No Azure DevOps write.
- No Azure Test Plans write.
- No repository write.
- No database persistence.
- No LLM call.
- No secrets in request or export.
- Export must label deterministic evidence, AI-assisted suggestions, draft-only output, reviewed local/session output, readiness preview, creation results, and automation planning.

Verification:

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- focused diff over README, docs, apps, packages/shared, package files, and `.env.example`
- `git diff --check`
- Safe in-process API tests for export validation, JSON/Markdown output, warnings/skips, disclaimers, no secrets, no PAT/Azure/LLM/repo writes, and existing automation/create/analysis routes.

Do not commit Step 0025. Do not create Git tags. Do not include tag recommendations.

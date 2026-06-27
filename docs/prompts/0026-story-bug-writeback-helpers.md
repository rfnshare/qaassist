# 0026 Story Bug Write-Back Helpers

Implement Step 0026 from `develop` on `feature/0026-story-bug-writeback-helpers`.

Goal: add preview-only helper flows for future Story/bug write-back work. The step must prepare and validate bug draft, comment draft, state transition, and attachment metadata previews without writing to Azure DevOps.

Required implementation:

- Add shared contracts under `packages/shared/src/writeback/writebackHelper.ts`.
- Add backend route `POST /writeback/preview`.
- Add deterministic preview service for:
  - `bug-draft`
  - `comment-draft`
  - `state-transition`
  - `attachment-metadata`
- Validate missing body, invalid helper type, helper-specific required fields, and secret-like request keys.
- Include warnings, required confirmations, status, payload preview, and the disclaimer:
  - `Write-back helper preview only. Nothing has been created or updated in Azure DevOps.`
- Add Story UI for selecting helper type, notes, target state, attachment metadata, previewing helper payloads, and viewing warnings/confirmations.

Safety requirements:

- No Azure DevOps calls.
- No Azure write-back.
- No bug creation.
- No comment posting.
- No state transition.
- No attachment upload.
- No LLM calls.
- No PAT or extension secrets.
- No persistence.

Verification:

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- focused diff over README, docs, apps, packages/shared, package files, and `.env.example`
- `git diff --check`
- Safe API tests for write-back preview validation, helper previews, secret rejection, no PAT/Azure/LLM/persistence, and existing export/automation/create routes.

Do not commit Step 0026. Do not create Git tags. Do not include tag recommendations.

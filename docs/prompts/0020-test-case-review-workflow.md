# 0020 Test Case Review Workflow

## Goal

Finalize Step 0019 if needed, then implement Step 0020: test case review/edit workflow.

## Product Boundary

Generated draft test cases are not final test cases. QA must be able to review, edit, approve for later export, reject, or block drafts before any future Azure Test Plans export/write-back.

This step is local/session review only. It does not call LLM providers, create Azure Test Plans items, write back to Azure DevOps, persist reviewed cases, create bugs, add automation integration, or store secrets.

## Implementation

- Add shared reviewed test case and review session contracts.
- Add backend `POST /test-cases/review/normalize` to validate and normalize review decisions without storage or external calls.
- Add extension API client support for review normalization.
- Add Story UI controls to edit generated draft title, objective, steps, expected result, and reviewer note.
- Require explicit user click before a case becomes `approved-for-export`.
- Keep rejected and blocked cases not ready for export.
- Preserve evidence links and warnings during review.
- Display a review summary and disclaimer that no Azure Test Plans item has been created.

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

Safe API tests should cover missing request pieces, invalid review decisions, approval validation, rejected/blocked readiness, approved evidence preservation, valid needs-review/edited/approved/rejected/blocked cases, and existing draft, analysis, extraction, and briefing routes.

## Expected Commit Message

`feat(test-cases): add review workflow`

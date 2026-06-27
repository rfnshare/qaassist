# Step 0029: Team Reporting/Analytics

## Goal

Finalize Step 0028 if needed, then implement Step 0029: team reporting/analytics.

## Scope

Add read-only, current-session analytics that summarize available QA Assist outputs for the selected board/team or current session.

## Constraints

- Do not write to Azure DevOps.
- Do not write to Azure Test Plans.
- Do not write to repositories.
- Do not call LLM providers.
- Do not require PATs.
- Do not store secrets in the extension.
- Do not persist analytics or add historical reporting.
- Do not invent board history or fake metrics.
- Warn when data is missing instead of guessing.
- Do not commit Step 0029.
- Do not create Git tags.

## Required Work

- Add shared team analytics contracts.
- Add backend `POST /reporting/team-analytics`.
- Validate body, reject secret-like keys, and require meaningful analytics input.
- Aggregate only provided session/current-view data.
- Add extension API client function.
- Add Today analytics card with metrics, sections, story summaries, warnings, and disclaimer.
- Reset analytics when underlying session data changes.
- Update docs and roadmap.

## Verification

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- `git diff --check`
- safe in-process API tests for validation, board-only analytics, review metrics, Test Plans outcomes, automation metrics, export/write-back summaries, secret rejection, and existing route compatibility

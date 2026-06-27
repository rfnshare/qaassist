# Step 0027: Broader AI-Assisted Refinement Rollout

## Goal

Finalize Step 0026 if needed, then implement Step 0027: broader AI-assisted refinement rollout.

## Scope

Add optional backend-only AI refinement layers on top of existing deterministic QA Assist outputs:

- Story analysis
- Draft test cases
- Automation candidates
- Write-back helper previews

Deterministic output remains the default baseline. AI output is suggestion-only, clearly labeled, and never auto-applied.

## Constraints

- Do not add extension-side AI keys.
- Do not commit `.env`.
- Do not remove deterministic routes or modes.
- Do not automatically switch existing flows from deterministic to AI.
- Do not auto-merge AI output into reviewed or export-ready data.
- Do not add database persistence.
- Do not change Azure/Test Plans creation behavior.
- Do not add repository writes.
- Do not call Azure DevOps from AI refinement.
- Do not create bugs, comments, state transitions, attachments, automation code, or Test Plans items from AI output.
- Do not commit Step 0027.
- Do not create Git tags.

## Required Work

- Add shared AI refinement contracts.
- Add backend `POST /ai/refine`.
- Validate target and deterministic input.
- Reject secret-like request keys.
- Use the backend LLM provider adapter only when available.
- Return structured `llm-assisted` suggestions with warnings and disclaimer.
- Add extension API client function.
- Add optional UI actions/results for draft cases, automation mapping, and write-back helper previews.
- Keep Story AI assist separate or compatible with existing behavior.
- Update docs and roadmap.

## Verification

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- focused diff
- safe in-process API tests for disabled, invalid, and mock provider behavior

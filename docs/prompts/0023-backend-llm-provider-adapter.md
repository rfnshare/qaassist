# 0023 Backend LLM Provider Adapter

## Goal

Finalize Step 0022 if needed, then implement Step 0023: optional backend LLM provider adapter.

## Product Boundary

Deterministic QA Assist flows remain the default safe baseline. This step adds a backend-only optional LLM boundary for future enhancement. The extension must not store provider secrets or call model providers directly.

## Implementation

- Add shared provider status and AI assist contracts.
- Add backend LLM config parsing for OpenAI and Azure OpenAI environment variables.
- Add provider status route returning non-secret summary only.
- Add a minimal `POST /ai/story-analysis/assist` route that requires deterministic analysis and returns suggestion-only `llm-assisted` output.
- Add OpenAI and Azure OpenAI adapter shapes behind the backend provider abstraction.
- Add extension provider status display in Settings without secret inputs.
- Add Story `Request AI assist` UI only after deterministic analysis and only as a separate suggestions section.

## Guardrails

- Deterministic mode remains default.
- AI output is suggestion-only and requires QA review.
- No extension-side AI keys.
- No Azure write-back, story linking, bug creation, draft regeneration, or persistence is added.
- Disabled or misconfigured provider states must be safe and explicit.

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

Safe API tests should cover provider status disabled/misconfigured/available, assist route validation, disabled/misconfigured assist responses, mock available provider suggestions, no secrets in response, no Azure/write-back path, and existing deterministic routes.

## Expected Commit Message

`feat(ai): add backend provider adapter`

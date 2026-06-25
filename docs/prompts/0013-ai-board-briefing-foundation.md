# Step 0013 Prompt: Evidence-Bound AI Board Briefing Foundation

Implement Step 0013 on `feature/0013-ai-board-briefing-foundation` after confirming Step 0012 is committed and merged into `develop`.

## Goal

Add a backend-mediated board briefing foundation that turns returned board condition evidence into a useful QA briefing. Before real LLM provider integration exists, use deterministic preview logic and label it clearly.

## Constraints

- Do not implement Azure write-back.
- Do not add extension-side AI keys.
- Do not call LLMs from the extension.
- Do not add PAT input to the extension.
- Do not store secrets in the extension.
- Do not commit `.env`.
- Do not add database persistence, file upload, Azure Test Plans write-back, or automation repo integration.
- Do not create fake board data.
- Do not claim deterministic output is LLM-generated.
- Preserve dark mode, Story URL detection, Azure setup/team discovery, and board condition preview.

## Implementation Scope

- Add shared board briefing contracts.
- Add deterministic backend board briefing service.
- Add `/briefings/board` route.
- Add extension API client support for briefing generation.
- Update Today so briefing generation is available after board condition fetch succeeds.
- Label deterministic output as evidence-bound preview briefing.
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

Safe API tests should confirm `/briefings/board` validates missing body, succeeds with minimal board evidence, does not require PAT, and does not call Azure DevOps or LLM providers.

Do not commit Step 0013 unless explicitly asked.

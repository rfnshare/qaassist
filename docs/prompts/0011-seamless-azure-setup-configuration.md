# Step 0011 Prompt: Seamless Azure Setup And Configuration Shell

Implement Step 0011 on `feature/0011-seamless-azure-setup-configuration` after confirming Step 0010 is committed and merged into `develop`.

## Goal

Make QA Assist setup feel product-grade for QA engineers instead of developer-oriented. Users should be guided to enter an Azure DevOps Services or Team Foundation Server URL, connect, select organization/project/team board, see `Selected Team: {organization}/{project}/{team}`, and then configure the rest of QA Assist.

## Constraints

- Do not implement OAuth or Microsoft Entra auth yet.
- Do not remove the local/dev backend PAT fallback.
- Do not add PAT input to the extension.
- Do not store PAT in the extension.
- Do not add write-back routes.
- Do not add LLM calls.
- Do not add file upload, Azure Test Plans write-back, automation repo integration, or database persistence.
- Do not show fake real data.
- Preserve read-only Azure board preview, dark mode, Story URL detection, and the four main nav sections.

## Implementation Scope

- Update shared Azure settings contracts with type-only connection mode/status and selected board display metadata.
- Update Settings into a configuration hub with Connect Azure, Select Team Board, QA Workflow, Test Management, Board Knowledge, AI Analysis, Automation, and Privacy & Approval cards.
- Keep API base URL as advanced local development configuration.
- Update Today to show setup-first state when no team board is selected.
- Show selected team when organization/project/team are configured.
- Add AI board briefing placeholder that clearly states LLM summary is not active yet.
- Update product, auth, security, data handling, Azure setup, UX, roadmap, prompt log, and README docs.
- Add `docs/configuration-experience.md` and `docs/ai-board-briefing.md`.

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

If new files are not included in the focused diff, run intent-to-add for the new docs and rerun the diff.

Do not commit Step 0011 unless explicitly asked.

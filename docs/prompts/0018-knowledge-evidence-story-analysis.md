# Step 0018 Prompt: Knowledge Evidence Story Analysis

Goal: finalize Step 0017 if needed, then implement board knowledge evidence linking to Story analysis.

Baseline:

- `main` is stable.
- `develop` is integration.
- Work through Step 0017 should be committed, merged, and pushed to `develop`.
- Future work branches from `develop`.
- Do not create Git tags.
- Do not include tag recommendations.

Product intent:

QA Assist can fetch Azure work item details, generate deterministic Story requirement/gap analysis, configure board knowledge metadata, and preview extracted `.txt`/`.md` text. Step 0018 lets the user explicitly attach selected board knowledge evidence to a Story analysis request.

This is still not LLM, final test case generation, Azure write-back, or automatic indexing.

Constraints:

- Board knowledge remains scoped to the selected team board.
- Extra knowledge evidence must be explicitly selected by the user.
- Extracted preview text is evidence preview, not truth.
- Do not automatically include all board knowledge.
- Do not include extracted full text if only a preview exists.
- Do not call LLMs.
- Do not add extension-side AI keys, PAT input, Azure write-back, Azure Test Plans write-back, bug creation, automation integration, database persistence, or long-term file storage.
- Preserve dark mode, Azure setup/team discovery, Today board condition fetch, board briefing, Story detail fetch, Story requirement/gap analysis, Board Knowledge metadata UI, and extraction preview UI.

Implementation scope:

1. Confirm Step 0017 is committed and merged into `develop`.
2. Create `feature/0018-knowledge-evidence-story-analysis`.
3. Refine shared Story analysis contracts with linked knowledge evidence and evidence coverage.
4. Update `/analysis/story-requirements` validation to accept optional `linkedKnowledgeEvidence`.
5. Require linked evidence items to have id, kind, title, evidence label, and `selectedByUser: true`.
6. Cap linked text preview server-side.
7. Update deterministic Story analysis to include linked evidence, evidence coverage, warnings, assumptions, needs confirmation, and cautious keyword-based test areas from preview text.
8. Update extension API client to send a typed Story analysis request.
9. Add Story linked evidence UI for metadata sources, latest session extraction preview, and a short user-confirmed note.
10. Keep extraction preview full text out of storage and include only capped preview text.
11. Update analysis result UI with evidence coverage and linked evidence.
12. Update docs and prompt log.

Verification:

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- `git diff -- README.md docs/ apps/ packages/shared/ package.json package-lock.json .env.example`

Safe API tests:

- `/health` returns 200.
- Existing minimal Story analysis still returns 200.
- Invalid linked evidence shapes return 400.
- Metadata-only evidence returns 200 with warning.
- Extracted preview evidence returns 200 with preview warning.
- Long linked text preview is capped server-side.
- Extraction, knowledge metadata, and board briefing routes still work.
- No PAT, Azure DevOps call, LLM call, storage, write-back, or generated test cases are added.

Expected proposed commit message:

```text
feat(story): link board knowledge evidence to analysis
```

Do not commit Step 0018.

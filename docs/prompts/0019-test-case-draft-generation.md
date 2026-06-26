# Step 0019 Prompt: Test Case Draft Generation

Goal: finalize Step 0018 if needed, then implement deterministic test case draft generation from confirmed evidence.

Baseline:

- `main` is stable.
- `develop` is integration.
- Work through Step 0018 should be committed, merged, and pushed to `develop`.
- Future work branches from `develop`.
- Do not create Git tags.
- Do not include tag recommendations.

Product intent:

QA Assist can fetch work item details, generate deterministic Story analysis, configure board knowledge metadata, preview extracted `.txt`/`.md` text, and explicitly link selected evidence into Story analysis. Step 0019 adds deterministic draft test case generation from the evidence already gathered while keeping QA in control.

This is still not LLM, Azure Test Plans creation, Azure write-back, final approved test cases, database persistence, or automation integration.

Constraints:

- Drafts are not final and require QA review.
- Do not generate final cases from weak/missing evidence without warnings.
- Drafts must include evidence links and uncertainty labels.
- Do not call LLMs.
- Do not add extension-side AI keys or PAT input.
- Do not store secrets, commit `.env`, persist drafts, persist extracted full text, or automatically include all board knowledge.
- Preserve dark mode, Azure setup/team discovery, Today board condition, board briefing, Story detail fetch, Story analysis, Board Knowledge metadata UI, extraction preview UI, and linked evidence flow.

Implementation scope:

1. Confirm Step 0018 is committed and merged into `develop`.
2. Create `feature/0019-test-case-draft-generation`.
3. Add shared test case draft contracts.
4. Add backend deterministic draft generation rules and service.
5. Add `POST /test-cases/drafts/generate`.
6. Validate work item, analysis, analysis mode, work item ID matching, arrays, and selected draft input booleans.
7. Generate conservative draft cases from acceptance criteria, description, likely test areas, high severity gaps, bug work item type, regression signal, and optionally linked knowledge.
8. Cap drafts at 8.
9. Add extension API client method.
10. Add Story draft UI after analysis succeeds.
11. Keep draft cases in React state only.
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
- Draft generation rejects missing body, missing work item, missing analysis, mismatched work item ID, invalid analysis mode, and invalid selected input types.
- Minimal valid Story analysis returns deterministic preview drafts.
- Missing/weak acceptance criteria produce warnings or blocked drafts.
- High severity gaps mark suite or affected cases as blocked.
- Bug work item produces bug verification draft.
- Linked evidence is included only when selected input enables it.
- Draft count is capped.
- Existing Story analysis, extraction, and briefing routes still work.

Expected proposed commit message:

```text
feat(test-cases): add deterministic draft generation
```

Do not commit Step 0019.

# Step 0016 Prompt: Board Knowledge Foundation

Goal: finalize Step 0015 if needed, then implement board knowledge and requirement upload foundation.

Baseline:

- `main` is stable.
- `develop` is integration.
- Work through Step 0015 should be committed, merged, and pushed to `develop`.
- Future work branches from `develop`.
- Do not create Git tags.
- Do not include tag recommendations.

Product intent:

QA Assist can connect Azure, fetch board condition, generate board briefing, fetch work item details, and generate deterministic Story requirement/gap analysis. Step 0016 creates the safe foundation for board-scoped knowledge sources so future analysis can combine Azure work item evidence with requirement documents, transcripts, BA/PO Q&A, product rules, release notes, test notes, known risks, and automation references.

Constraints:

- Knowledge must be scoped to the selected team board.
- Step 0016 is metadata-only.
- Do not parse file contents.
- Do not upload file bytes.
- Do not index content.
- Do not call LLMs.
- Do not store secrets.
- Do not create Azure write-back.
- Do not create bugs, test cases, Azure Test Plans items, or automation.
- Do not show fake uploaded documents.

Implementation scope:

1. Confirm Step 0015 is committed and merged into `develop`.
2. Create `feature/0016-board-knowledge-foundation`.
3. Refine board knowledge shared contracts.
4. Add metadata-only backend routes:
   - `POST /knowledge/board/sources/validate`
   - `POST /knowledge/board/summary`
5. Register routes in the API app.
6. Add extension API client methods.
7. Replace the Settings Board Knowledge placeholder with a compact metadata-only shell.
8. Store non-secret metadata in extension local settings scoped to the selected team board.
9. Update Story copy to say board knowledge is not included in analysis yet.
10. Update docs and prompt log.

Verification:

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- `git diff -- README.md docs/ apps/ packages/shared/ package.json package-lock.json .env.example`

Expected proposed commit message:

```text
feat(knowledge): add board knowledge metadata foundation
```

Do not commit Step 0016.

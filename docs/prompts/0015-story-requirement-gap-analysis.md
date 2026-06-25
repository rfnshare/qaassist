# Step 0015 Prompt: Story Requirement Gap Analysis

Goal: finalize Step 0014 if needed, then implement deterministic requirement and gap analysis for the Story workspace.

Baseline:

- `main` is stable.
- `develop` is integration.
- Work through Step 0014 should be committed, merged, and pushed to `develop`.
- Future work branches from `develop`.
- Do not create Git tags.
- Do not include tag recommendations.

Product intent:

QA Assist can fetch read-only Azure work item details and show a Story workspace. Step 0015 makes the Story tab more useful before LLM integration by adding backend-generated deterministic analysis based only on fetched work item detail evidence.

Analysis output should include:

- requirement summary
- acceptance criteria coverage/status
- QA gaps/questions
- likely test areas
- risk notes
- assumptions
- needs-confirmation items

Constraints:

- Requirement analysis must be evidence-bound.
- Do not pretend deterministic analysis is LLM-generated.
- Do not create final test cases.
- Do not write anything back to Azure.
- Do not create bugs.
- Do not create Azure Test Plans items.
- Do not add automation generation.
- Extension must not store PAT.
- Extension must not call Azure DevOps directly.
- Extension must not call LLM providers directly.
- All Azure calls and future AI calls go through backend.

Implementation scope:

1. Confirm Step 0014 is committed and merged into `develop`.
2. Create `feature/0015-story-requirement-gap-analysis`.
3. Add dependency-free shared Story analysis contracts.
4. Add backend deterministic analysis service and disclaimer.
5. Add `POST /analysis/story-requirements`.
6. Validate request body safely.
7. Add extension API client method.
8. Add Story UI action and compact evidence-bound preview output.
9. Reset analysis when a new work item detail is fetched or detected context changes.
10. Update README, UX, data handling, security, hallucination guardrails, roadmap, prompt log, and this prompt file.

Verification:

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- `git diff -- README.md docs/ apps/ packages/shared/ package.json package-lock.json .env.example`

Safe API tests:

- `/health` returns 200.
- `/analysis/story-requirements` missing body returns 400.
- `/analysis/story-requirements` missing workItem returns 400.
- `/analysis/story-requirements` minimal valid work item returns 200 and deterministic-preview mode.
- Missing acceptance criteria returns an acceptance criteria gap.
- Minimal bug work item returns bug-oriented gaps/questions.
- Analysis route does not require Azure PAT, call Azure DevOps, or call LLM providers.
- Existing `/azure-devops/work-items/detail` valid org/project/workItemId with no PAT returns safe 503.
- Existing `/briefings/board` minimal valid evidence returns 200.

Expected proposed commit message:

```text
feat(story): add requirement gap analysis
```

Do not commit Step 0015.

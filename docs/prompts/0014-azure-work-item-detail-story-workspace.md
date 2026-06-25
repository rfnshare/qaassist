# Step 0014 Prompt: Azure Work Item Detail Story Workspace

Goal: finalize Step 0013 if needed, then implement Step 0014: Azure work item detail fetch and Story workspace foundation.

Current baseline:

- `main` is stable.
- `develop` is integration.
- Work through Step 0013 should be committed, merged, and pushed to `develop`.
- Future work branches from `develop`.
- Do not create Git tags.
- Do not include tag recommendations.

Product intent:

QA Assist has setup, team discovery, board preview, and an evidence-bound board briefing. Step 0014 makes the Story tab a real QA workspace when the user opens an Azure DevOps work item.

The Story workspace should help QA understand the current story, bug, or task using real Azure work item details:

- title
- work item type
- state
- assigned to
- description
- acceptance criteria
- tags
- priority, severity, and story points when available
- changed and created dates
- parent, child, related, duplicate, tested-by, and test-case links when available
- evidence and source labels
- requirement-analysis placeholder
- gaps/questions placeholder
- test-scope placeholder

Constraints:

- Do not implement Azure write-back.
- Do not add LLM calls.
- Do not add extension-side AI keys.
- Do not add PAT input to the extension.
- Do not store secrets in the extension.
- Do not commit `.env`.
- Do not add database persistence.
- Do not add file upload implementation.
- Do not add Azure Test Plans write-back.
- Do not add automation repo integration.
- Do not show fake work item data.
- All Azure DevOps interactions remain read-only.
- Preserve dark mode, setup/team discovery, Today board condition fetch, board briefing, and Azure page detection.

Implementation scope:

1. Confirm Step 0013 is committed and merged into `develop`.
2. Create or switch to `feature/0014-azure-work-item-detail-story-workspace`.
3. Add dependency-free shared work item detail contracts under `packages/shared/src/work-items/workItemDetail.ts`.
4. Export the new contracts from `packages/shared/src/index.ts`.
5. Add a backend read-only Azure DevOps work item detail service using `GET /{project}/_apis/wit/workitems/{id}?$expand=Relations`.
6. Add a safe mapper for Azure fields, HTML-backed fields, identities, tags, numeric fields, and relations.
7. Add `POST /azure-devops/work-items/detail` with backend validation for organization, project, work item ID, optional team, and optional URL.
8. Add extension API client support for fetching work item detail through the backend only.
9. Update the Story tab with a fetch button, source labels, safe text previews, relation summary, and inactive requirement/gap/test-scope placeholder cards.
10. Update docs for UX, data handling, security, hallucination guardrails, roadmap, prompt log, and README.

Verification:

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- `git diff -- README.md docs/ apps/ packages/shared/ package.json package-lock.json .env.example`

Safe API tests:

- `/health` returns 200.
- `/azure-devops/work-items/detail` missing body returns 400.
- Missing organization returns 400.
- Missing project returns 400.
- Invalid work item ID returns 400.
- Valid organization/project/work item ID with no PAT returns safe 503.
- Existing `/briefings/board` minimal valid evidence still returns 200 and deterministic-preview mode.
- Existing `/azure-devops/setup/connect` valid URL without PAT returns safe 503.
- No secrets printed.

Expected proposed commit message:

```text
feat(story): add Azure work item detail workspace
```

Do not commit Step 0014.

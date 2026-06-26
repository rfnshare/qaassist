# Step 0017 Prompt: Safe File Extraction Foundation

Goal: finalize Step 0016 if needed, then implement safe file upload and content extraction design for board knowledge.

Baseline:

- `main` is stable.
- `develop` is integration.
- Work through Step 0016 should be committed, merged, and pushed to `develop`.
- Future work branches from `develop`.
- Do not create Git tags.
- Do not include tag recommendations.

Product intent:

Step 0016 added board knowledge metadata only. Step 0017 adds a safe, minimal file-content boundary so later steps can use requirement documents as evidence. This is extraction preview only, not LLM ingestion, indexing, final Story analysis, or long-term file storage.

Constraints:

- Board knowledge remains scoped to the selected team board.
- Backend controls file/content handling.
- Extension never sends secrets, calls Azure DevOps directly for knowledge, or calls LLM providers.
- Do not call LLMs.
- Do not add Azure write-back, Azure Test Plans write-back, bug creation, final test cases, automation integration, database persistence, or long-term file storage.
- Do not pretend files are indexed.
- Do not include board knowledge in Story analysis yet.
- Preserve dark mode, Azure setup/team discovery, Today board condition fetch, board briefing, Story detail fetch, Story requirement/gap analysis, and Board Knowledge metadata-only UI.

Implementation scope:

1. Confirm Step 0016 is committed and merged into `develop`.
2. Create `feature/0017-safe-file-extraction-foundation`.
3. Add shared knowledge extraction contracts.
4. Add backend extraction policy and service.
5. Add `POST /knowledge/board/sources/extract-text`.
6. Keep the route JSON-only for manually pasted `.txt` and `.md` content.
7. Reject unsupported extensions, missing data, over-limit content, and binary-looking text.
8. Return extracted evidence preview, warnings, limitations, and capped preview text only.
9. Add extension API client method.
10. Add Settings > Board Knowledge extraction preview UI.
11. Keep file selector metadata-only and do not read file bytes automatically.
12. Keep extracted full text out of `chrome.storage.local`.
13. Update Story copy to say board knowledge/extraction preview is not included in analysis yet.
14. Update docs and prompt log.

Verification:

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- `git diff -- README.md docs/ apps/ packages/shared/ package.json package-lock.json .env.example`

Safe API tests:

- `/health` returns 200.
- `/knowledge/board/sources/extract-text` validates missing body, selected board, source, file, file name, text content, unsupported extension, over-limit content, and binary-looking content.
- Valid `.txt` and `.md` inputs return `status: extracted`.
- Large valid content within the limit returns `extracted` with a preview truncation warning.
- The route does not require Azure PAT, call Azure DevOps, call LLM providers, or store data.
- Existing knowledge, Story analysis, and board briefing routes still return expected safe responses.

Expected proposed commit message:

```text
feat(knowledge): add safe text extraction preview
```

Do not commit Step 0017.

# Prompt 0005 - Azure DevOps Page Detection

Goal:
Add Azure DevOps work item page detection to the browser extension. This step should detect supported Azure DevOps work item URLs, parse organization/project/work item ID where possible, and show that detected context in the side panel. Do not call Azure DevOps APIs yet. Do not implement auth yet. Do not call backend APIs yet. Do not call LLM APIs yet.

Preconditions:

- Step 0001 project foundation committed.
- Step 0002 extension shell committed.
- Step 0003 API skeleton committed.
- Step 0004 shared contracts committed.
- Start from the latest approved branch state after Step 0004 commit.
- Create or switch to branch `feature/0005-azure-devops-page-detection`.
- Do not commit Step 0005.
- Do not create tags.

Product context:
QA Assist is a browser-extension-based embedded QA assistant for QA engineers. The first platform is Azure DevOps Boards. The assistant should eventually appear as a right-side panel beside Azure DevOps work items. Step 0005 only detects the current Azure DevOps work item page and displays parsed page context in the extension side panel.

Important constraints:

- Do not implement Azure DevOps OAuth.
- Do not implement PAT handling.
- Do not fetch Azure DevOps work item data from API.
- Do not call the backend.
- Do not call an LLM.
- Do not generate QA analysis.
- Do not store secrets.
- Do not add broad host permissions beyond Azure DevOps URLs needed for detection.
- Do not scrape sensitive story text yet.
- Detect only page URL and safe visible metadata if needed.
- Preserve docs and project direction.
- Follow root `AGENTS.md`.

Detection scope:

- `https://dev.azure.com/{organization}/{project}/_workitems/edit/{id}`
- `https://dev.azure.com/{organization}/{project}/_boards/board/t/{team}/Stories/?workitem={id}` if practical.
- `https://{organization}.visualstudio.com/{project}/_workitems/edit/{id}` if practical.

Minimum required detection:

- Detect `dev.azure.com/{organization}/{project}/_workitems/edit/{id}`.
- Parse source, organization, project, work item ID, work item URL, and detection timestamp.
- Gracefully show unsupported state when current page is not a supported Azure DevOps work item page.

Implementation tasks:

1. Inspect and read project docs and `packages/shared/src/work-items/workItemContext.ts`.
2. Create or switch to `feature/0005-azure-devops-page-detection`.
3. Update extension manifest to register a content script only for Azure DevOps hosts.
4. Add Azure DevOps-only host permissions.
5. Add `apps/extension/src/adapters/azureDevOpsPageAdapter.ts`.
6. Add a URL parser function such as `parseAzureDevOpsWorkItemUrl(url: string): AzureDevOpsPageContext | null`.
7. Define lightweight extension-side `AzureDevOpsPageContext` with source, organization, project, work item ID, work item URL, and detected timestamp.
8. Update content script to detect current page context and send it to extension runtime.
9. Update side panel to request or receive detected page context.
10. Show detection status in the Story tab.
11. Keep Setup, Analysis, and Settings placeholders intact.
12. Do not show fake story title, fake description, or fake analysis.
13. Add safe runtime messaging types.
14. Keep this step focused.
15. Update docs and store this prompt.

Verification:

- Run `npm run typecheck`.
- Run `npm run build`.
- Run `git status --short`.
- Run `git diff -- README.md docs/ package.json package-lock.json apps/ packages/`.
- Manually verify parser handling for supported dev.azure.com, visualstudio.com, and unsupported URLs.

Expected proposed commit message:

```text
feat(extension): detect Azure DevOps work item pages
```

Expected tag recommendation:
No tag yet.

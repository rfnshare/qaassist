# Step 0007 Prompt: Simplified UI And Dark Mode

Goal: finalize Step 0006 if needed, then implement Step 0007 as an uncommitted review branch.

Branch:

```text
feature/0007-simplified-ui-dark-mode
```

Step 0007 redesigns the QA Assist extension UI into a simplified, calm, premium, small-window-friendly assistant with dark mode. The previous cockpit direction remains valid as product strategy, but the browser side panel should not show every future module at once.

## Process Rules

- Do not create Git tags.
- Do not recommit Step 0006 if it is already committed.
- Keep Step 0007 uncommitted for review.
- Follow root `AGENTS.md`.
- Include verification, status, and diff output in the final response.

## Product Design Principles

1. Small side panel first.
2. One primary action per screen.
3. Progressive disclosure instead of showing every future module at once.
4. No fake real data.
5. Placeholder information must be clearly marked.
6. Short copy, not long explanations.
7. Calm colors, strong whitespace, clear status.
8. Dark mode and light mode using CSS variables.
9. No heavy animation libraries.
10. CSS-only subtle transitions.
11. Keep Azure DevOps URL detection from Step 0005 working.
12. Keep security and approval messaging, but make it less noisy in UI.
13. Human confirmation remains final.
14. Do not implement write-back, LLM, Azure API fetch, auth, file upload, Azure Test Plans write-back, or Playwright generation.

## UI Scope

Replace the 8-section cockpit navigation with four sections:

1. Today
2. Story
3. Run
4. Settings

Today should show setup/connection status, one large primary action, and clearly labeled placeholders for board summary, QA work, retest work, updates, and suggested next work.

Story should show detected Azure DevOps context when available: organization, project, work item ID, URL, and detected timestamp. The primary action should be `Start story review` when detected and `Open Azure DevOps story` otherwise.

Run should prepare the manual testing companion concept with placeholders for guided execution, evidence, bug creation, and later automation support.

Settings should include a theme toggle and compact placeholders for Azure DevOps connection, board mapping, QA user, Azure Test Plans, board knowledge/files, LLM connection, and privacy mode.

## Implementation Requirements

- Redesign `apps/extension/src/sidepanel/App.tsx`.
- Update or replace side panel components as needed.
- Keep component structure clean.
- Remove unused crowded components.
- Use CSS variables for background, surface, surface-muted, text, text-muted, border, primary, primary-hover, accent, and warning/danger if needed.
- Add dark mode with a root `data-theme` attribute.
- Persist theme choice if practical using `chrome.storage.local`; otherwise use local storage with a future note.
- Respect system preference by default if practical.
- Add CSS-only transitions for buttons, cards, section changes, and theme changes.
- Do not add new UI dependencies or icon packages.
- Keep accessibility basics: clear labels, active nav state, contrast, and readable motion.

## Documentation Tasks

- Update `README.md` with Step 0007 status and demo instructions.
- Update `docs/ux-workflow.md` with the simplified four-section UI, progressive disclosure, one primary action, and small-window design.
- Create or update `docs/ui-design-principles.md`.
- Update `docs/implementation-roadmap.md`, moving board/work summary contracts to Step 0008 and Azure board fetch to Step 0009.
- Update `docs/prompt-log.md`.
- Store this prompt in `docs/prompts/0007-simplified-ui-dark-mode.md`.

## Verification

Run:

```bash
npm run typecheck
npm run build
git ls-files apps/api/dist apps/extension/dist packages/shared/dist
Get-ChildItem -Recurse -Force -Filter '.env'
git status --short
git diff -- README.md docs/ apps/extension/ package.json package-lock.json
```

Also report manual sanity checks:

1. Non-Azure pages still show unsupported/detection guidance.
2. Azure DevOps parser handles `https://dev.azure.com/my-org/my-project/_workitems/edit/12345`.
3. Azure DevOps parser handles `https://my-org.visualstudio.com/my-project/_workitems/edit/12345`.
4. Story panel shows detected organization, project, work item ID, URL, and detected timestamp.
5. UI has only Today, Story, Run, and Settings primary sections.
6. Dark mode works or the implementation is explained.
7. No fake board counts are shown as real data.
8. No new UI animation dependency is added.
9. One large primary action exists on the main panels.

Proposed commit message:

```text
feat(extension): simplify side panel UI and add dark mode
```

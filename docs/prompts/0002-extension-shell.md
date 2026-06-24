# Prompt 0002 - Extension Shell

Goal:
Implement Step 0002: create the browser extension shell with a right-side assistant panel. This step should create the extension project structure and a minimal working UI shell only. Do not implement Azure DevOps integration, backend calls, LLM calls, or QA analysis logic yet.

Preconditions:

- Step 0001 project foundation should already be committed.
- Start from the latest `main` or the approved foundation branch state.
- Create or switch to branch: `feature/0002-extension-shell`.
- Do not commit.
- Do not tag.

Product context:
QA Assist is a browser-extension-based embedded QA assistant for QA engineers. The first platform will be Azure DevOps Boards, but this step only creates the extension shell. The assistant should eventually appear as a right-side panel beside Azure DevOps work items. The MVP workflow is feature/story QA analysis, not production incident workflow.

Important constraints:

- Do not create a standalone HTML product.
- Do not implement Azure DevOps page detection yet.
- Do not implement Azure DevOps auth yet.
- Do not implement LLM connection yet.
- Do not store secrets.
- Do not add sample API keys, tokens, or credentials.
- Preserve and update documentation where needed.
- Follow root `AGENTS.md`.

Technical direction:
Use a modern TypeScript browser extension setup. Prefer a Vite-based or WXT-based extension structure if practical. The shell should support Chrome Manifest V3 and be suitable for Chrome first, Edge later.

Tasks:

1. Inspect the existing repository files and read `AGENTS.md`, `README.md`, `docs/architecture.md`, `docs/implementation-roadmap.md`, and `docs/git-workflow.md`.
2. Create or switch to branch `feature/0002-extension-shell`.
3. Add an extension app under `apps/extension`.
4. Set up a minimal TypeScript/React extension shell with side panel entry, background/service worker entry, minimal content script placeholder, manifest config, and basic styling.
5. The side panel UI should have Header `QA Assist`, status card `Extension shell ready`, setup placeholder, story placeholder, analysis placeholder, and settings placeholder.
6. Add simple navigation or tabs inside the side panel: Setup, Story, Analysis, Settings.
7. Add a minimal browser extension manifest with permissions needed for the shell only: `sidePanel`, `storage`, and `activeTab`.
8. Add basic scripts in the extension package: `dev`, `build`, and `typecheck` if practical.
9. Add or update root/package workspace configuration if needed.
10. Update documentation in `README.md`, `docs/architecture.md`, `docs/implementation-roadmap.md`, `docs/prompt-log.md`, and `docs/prompts/0002-extension-shell.md`.
11. Keep generated files reasonable. Do not add huge build outputs, caches, or `node_modules`.
12. Ensure `.gitignore` excludes generated dependency/build/cache folders.

Preferred folder shape:

```text
apps/
  extension/
    package.json
    tsconfig.json
    index.html or sidepanel.html if needed
    public/
    src/
      background/
        index.ts
      content/
        index.ts
      sidepanel/
        App.tsx
        main.tsx
        styles.css
        components/
          Header.tsx
          StatusCard.tsx
          Navigation.tsx
          PlaceholderPanel.tsx
      shared/
        extensionMessages.ts
    manifest.json or framework config
```

UI requirements:

- Keep UI simple and clean.
- It should clearly show that this is an early shell.
- No fake analysis output.
- No fake Azure DevOps data.
- No fake login state.
- Placeholder text is okay if clearly labeled as placeholder.

Verification:

- Package install only if required for the selected tooling.
- Typecheck if available.
- Build if available.
- Run `git status --short`.

Expected proposed commit message:

```text
feat(extension): add browser extension shell
```

Expected tag recommendation:
No tag yet.

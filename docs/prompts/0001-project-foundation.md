# Prompt 0001 - Project Foundation And Documentation

Goal:
Create the project foundation, documentation structure, agent instructions, git workflow notes, and implementation prompt log. This step should not implement app runtime code yet.

Product context:
QA Assist is a browser-extension-based embedded QA assistant for QA engineers. The first platform is Azure DevOps Boards. The first workflow is feature/story QA analysis. The extension should open a right-side assistant panel beside an Azure DevOps work item. It should help QA engineers generate requirement questions, impacted areas, test scope, test cases, regression scope, automation candidates, and UAT handoff notes. Production incident workflow is intentionally out of MVP scope. Playwright generation is later; MVP only marks automation candidates.

Process rules:

- Start from `main`.
- Create or switch to branch: `feature/0001-project-foundation`.
- Do not commit.
- Do not tag.
- Do not add application code yet.
- Do not add package dependencies yet unless absolutely necessary.
- Keep the diff documentation-focused.

Tasks:

1. Inspect the repository structure.
2. If git is not initialized, initialize git and create/use `main` as the base branch.
3. Create or update these files:
   - `README.md`
   - `AGENTS.md`
   - `.gitignore`
   - `.editorconfig`
   - `docs/product-plan.md`
   - `docs/architecture.md`
   - `docs/auth-plan.md`
   - `docs/implementation-roadmap.md`
   - `docs/git-workflow.md`
   - `docs/decision-log.md`
   - `docs/prompt-log.md`
   - `docs/prompts/0001-project-foundation.md`
   - `docs/codex/AGENTS.override.example.md`
4. In `README.md`, include product summary, MVP scope, non-goals, planned architecture, and current status.
5. In root `AGENTS.md`, include durable project rules for Codex/agents.
6. In `docs/product-plan.md`, capture the approved product direction.
7. In `docs/architecture.md`, describe the target architecture.
8. In `docs/auth-plan.md`, describe Azure DevOps OAuth direction, local/dev PAT rules, LLM key handling, and token reuse restrictions.
9. In `docs/implementation-roadmap.md`, break implementation into small steps.
10. In `docs/git-workflow.md`, document branch naming, commit style, review-before-commit rule, and tag policy.
11. In `docs/decision-log.md`, add initial accepted architecture decisions.
12. In `docs/prompt-log.md`, explain how implementation prompts should be copied into `docs/prompts/`.
13. In `docs/prompts/0001-project-foundation.md`, store this prompt or a faithful copy of it.
14. In `docs/codex/AGENTS.override.example.md`, create an optional local override example with no secrets.

Verification:

- Run `git status --short`.
- If available, run a markdown formatting/lint check, but do not install dependencies just for this step.
- Read back the created docs enough to ensure there are no placeholder TODO-only files.

Expected proposed commit message:

```text
docs(plan): add QA Assist project foundation
```

Expected tag recommendation:
No tag yet unless the human explicitly wants to tag the approved plan foundation as `v0.0.1-plan-foundation`.

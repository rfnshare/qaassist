# QA Assist Agent Instructions

You are working on QA Assist, an embedded QA assistant for QA engineers.

Follow these rules strictly:

1. Work one step at a time.
2. Do not commit unless explicitly asked.
3. Do not create or move git tags unless explicitly asked.
4. Before changing files, inspect the current repo structure.
5. Keep changes scoped to the requested step only.
6. Update documentation whenever behavior, architecture, commands, or conventions change.
7. Never add secrets, API keys, tokens, customer data, or real credentials.
8. Prefer small, reviewable diffs.
9. Preserve existing documentation and project conventions.
10. Do not build the product as standalone HTML. QA Assist is extension first.
11. Keep Azure DevOps as the first supported platform unless the product direction changes.
12. Use backend-mediated LLM access for the product architecture.
13. Use structured schemas for QA output.
14. Treat Playwright generation as a later capability, not MVP code generation.
15. Do not reuse Codex, ChatGPT, VS Code, browser, or unrelated app login tokens.

After every task, report:

- Files changed.
- Commands run.
- Verification result.
- Assumptions made.
- Proposed commit message.
- Whether a tag is recommended.

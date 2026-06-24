# Prompt 0006 - Product Replan, Foundation, And QA Cockpit UI

Goal:
Finalize approved Step 0005 if needed, then implement Step 0006: product replan, strong foundation/security documentation, and premium QA cockpit UI shell.

Key constraints:

- Do not create tags.
- Commit Step 0005 only if needed.
- Keep Step 0006 uncommitted for review.
- Do not implement Azure DevOps API fetch, auth, LLM calls, Azure Test Plans, file upload, Playwright generation, or storage.
- Do not store secrets.
- Do not show fake real board data.
- Label preview/demo content clearly.
- Keep QA Assist evidence-bound and human-approved.

Step 0006 scope:

- Update durable agent rules.
- Expand product plan around QA command center, story workspace, requirement clarification, scope builder, source-of-truth test cases, manual testing, bug creation, and future Playwright automation.
- Add security, data handling, hallucination guardrail, test case, manual testing, automation, Azure DevOps settings, and UX workflow docs.
- Replace the simple tab shell with a QA cockpit layout containing Command Center, Work Queue, Story Workspace, Scope & Cases, Manual Run, Automation, Mail, and Settings.
- Preserve Step 0005 Azure DevOps URL detection in Story Workspace.

Expected proposed Step 0006 commit:

```text
feat(extension): add QA cockpit UI shell
```

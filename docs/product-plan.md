# Product Plan

## Product

QA Assist is an embedded QA assistant for QA engineers working on feature/story validation.

## First Vehicle

The first implementation vehicle is a Chrome/Edge browser extension. The extension should open a right-side assistant panel while the QA engineer remains inside the source application.

## First Platform

Azure DevOps Boards / Work Items is the first supported platform.

## First Workflow

The first workflow is feature/story QA analysis:

1. Understand the story or requirement.
2. Identify missing or ambiguous requirements.
3. Identify impacted product areas.
4. Draft manual test scope.
5. Draft functional, negative, edge, and regression test cases.
6. Mark automation candidates.
7. Prepare UAT handoff notes.

## MVP Output

The MVP should produce structured sections for:

- Requirement summary.
- BA/Product questions.
- Impacted areas.
- Manual test scope.
- Test cases.
- Regression scope.
- Automation candidates.
- UAT notes.

## Explicitly Skipped In MVP

- Production incident workflow.
- Jira support.
- TestRail or Zephyr integration.
- Full Playwright code generation.
- Direct LLM keys inside the extension for production.
- Reuse of Codex, ChatGPT, VS Code, or unrelated application tokens.

## Product Principle

QA Assist should help the QA engineer work inside the tools they already use. It should reduce context switching, writing overhead, and missed requirement risk while keeping the QA engineer in control.

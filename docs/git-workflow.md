# Git Workflow

## Branch Naming

Use one branch per implementation step.

```text
feature/0001-project-foundation
feature/0002-extension-shell
feature/0003-api-skeleton
feature/0004-shared-contracts
feature/0005-azure-devops-detection
feature/0006-work-item-fetch
feature/0007-llm-gateway
feature/0008-qa-analysis-engine
feature/0009-analysis-ui
feature/0010-post-comment
```

## Commit Message Style

Use:

```text
<type>(<scope>): <summary>
```

Examples:

```text
docs(plan): add QA Assist project foundation
feat(extension): add browser extension shell
feat(api): add backend API skeleton
feat(shared): add work item and QA analysis contracts
```

## Review Before Commit

Codex and other agents must not commit unless explicitly asked by the human. Changes should be reviewed first using `git status --short` and, when useful, `git diff`.

## Tag Policy

Do not create or move tags unless explicitly asked.

Recommended milestone tags:

```text
v0.0.1-plan-foundation
v0.0.2-extension-shell
v0.0.3-api-skeleton
v0.1.0-story-analysis-mvp
```

Do not tag every branch. Tag only stable, review-approved milestones.

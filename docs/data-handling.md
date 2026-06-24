# Data Handling

## Data Categories

- Board data: project, board, sprint, states, assignments, work counts, and state mapping.
- Story data: title, description, acceptance criteria, comments, links, attachments, tags, and status.
- Uploaded requirement files: PRDs, transcripts, Q&A, product notes, API notes, screenshots, and meeting summaries.
- Generated analysis: questions, assumptions, scope, test cases, risks, automation candidates, and UAT notes.
- Execution evidence: manual run notes, screenshots, videos, console/network summaries, defects, and retest evidence.

## Defaults

Raw content should not be persisted unless the user or team explicitly enables it. Board knowledge and uploaded files must be scoped to the selected board. Future LLM calls should minimize, redact, and source-label data before sending it to a provider.

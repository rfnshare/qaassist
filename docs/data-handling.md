# Data Handling

## Data Categories

- Board data: project, board, sprint, states, assignments, work counts, and state mapping.
- Story data: title, description, acceptance criteria, comments, links, attachments, tags, and status.
- Uploaded requirement files: PRDs, transcripts, Q&A, product notes, API notes, screenshots, and meeting summaries.
- Generated analysis: questions, assumptions, scope, test cases, risks, automation candidates, and UAT notes.
- Derived board summaries: board summary snapshots, work queue buckets, state buckets, freshness labels, and recommendation signals.
- Execution evidence: manual run notes, screenshots, videos, console/network summaries, defects, and retest evidence.

## Defaults

Raw board/story content should not be persisted by default unless the user or team explicitly enables it. Board summary snapshots and recommendation signals are derived data and must keep source/freshness labels so the UI does not imply fake certainty. Board knowledge and uploaded files must be scoped to the selected board. Future LLM calls should minimize, redact, and source-label data before sending it to a provider.

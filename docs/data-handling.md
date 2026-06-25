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

Step 0009 fetches board summary preview data on demand through the backend only. Step 0011 keeps that read-only preview and adds a clearer selected team board setup shell. Step 0012 adds read-only connection, project, and team discovery through the backend. Step 0013 generates deterministic board briefings from returned board summary, work queue, and recommendation evidence without storing raw board/story data. The extension stores non-secret settings such as server URL, connection status, organization, project, team, board, iteration path, current QA user, and local API base URL. It does not store PATs or AI keys. The backend reads the local development PAT from its environment, uses it only for outbound Azure DevOps requests, and does not persist raw board/story data by default.

Future board knowledge uploads must be scoped to the selected team board and should not become broad organization memory. Future AI board briefing should label source-backed data, assumptions, and needs-confirmation content before anything is treated as actionable.

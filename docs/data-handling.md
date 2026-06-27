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

Step 0009 fetches board summary preview data on demand through the backend only. Step 0011 keeps that read-only preview and adds a clearer selected team board setup shell. Step 0012 adds read-only connection, project, and team discovery through the backend. Step 0013 generates deterministic board briefings from returned board summary, work queue, and recommendation evidence without storing raw board/story data. Step 0014 fetches read-only work item detail through the backend for the Story workspace. Step 0015 generates deterministic requirement/gap analysis from fetched work item detail only and does not persist raw story content by default. Step 0016 stores only board-scoped knowledge source metadata in extension local settings. Step 0017 adds JSON-only extraction preview for manually pasted `.txt` and `.md` text through the backend, but it does not persist full extracted text, index content, or call an LLM. Step 0018 lets the user explicitly include selected metadata, capped extraction preview text, or a short user-confirmed note in a Story analysis request. Step 0019 generates deterministic draft test cases from the fetched work item and analysis evidence; drafts stay in React state only and are not written to Azure Test Plans. Step 0020 lets the user review and edit those drafts in session state and send review decisions to the backend for validation/normalization only. Step 0021 sends the validated review session and non-secret Test Plan/Suite target settings to a backend readiness preview route only; the response is derived eligibility data and is not persisted, exported, or written back. The extension stores non-secret settings such as server URL, connection status, organization, project, team, board, iteration path, current QA user, local API base URL, board knowledge metadata, and optional Test Plan/Suite target IDs. It does not store PATs, AI keys, extracted full text, draft test cases, reviewed test cases, or readiness results. The backend reads the local development PAT from its environment, uses it only for outbound Azure DevOps requests, and does not persist raw board/story data by default.

Long or private story descriptions and acceptance criteria should be minimized in logs, screenshots, and final reports. They are source evidence for the QA user, not content to persist or copy broadly by default.

Future board knowledge uploads must be scoped to the selected team board and should not become broad organization memory. Metadata-only sources and extraction previews are analyzed only when explicitly linked by the user, and even then they remain limited evidence until reviewed and confirmed. Future AI board briefing or Story analysis should label source-backed data, assumptions, and needs-confirmation content before anything is treated as actionable.

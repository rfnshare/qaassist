# UX Workflow

QA Assist uses a simplified four-section side panel designed for a narrow browser extension window. The workflow should feel calm first, then progressively reveal deeper QA work only when the engineer asks for it.

## Primary Sections

1. Today helps the QA engineer orient quickly with selected team board status, board condition, ready-to-retest work, assigned QA work, future AI board briefing, and one clear next action.
2. Story focuses on the currently detected Azure DevOps work item, read-only source-backed detail fetch, deterministic requirement/gap preview analysis, and future scope/test case approval.
3. Run prepares the future manual testing companion, evidence capture, bug creation, and automation candidate flow.
4. Settings keeps theme, Azure connection, team board selection, QA workflow, Azure Test Plans, board knowledge, AI analysis, automation, privacy, approval, and advanced local development settings compact.

## Interaction Model

Each main section should have one large primary action. Secondary details live in compact cards so the panel does not feel like a dashboard squeezed into a drawer.

Progressive disclosure matters because QA Assist will eventually cover board awareness, story analysis, manual execution, bugs, UAT handoff, Azure Test Plans, and automation. The side panel should introduce those capabilities as a path, not as a wall of modules.

## Trust Rules

Preview values must be clearly labeled as preview-only or not connected until Azure DevOps fetch is implemented. Do not show fake counts, fake story titles, fake test cases, or fake analysis as real data.

## Story Workspace

Step 0014 turns Story into the first real QA workspace foundation. When a supported Azure DevOps work item page is detected, the user can fetch work item details through the QA Assist backend. The extension must not call Azure DevOps directly, request a PAT, or store secrets.

Step 0015 adds deterministic requirement and gap analysis after work item detail is fetched. The analysis uses only fetched title, type, state, description, acceptance criteria, tags, fields, relations, and metadata. It must be labeled as evidence-bound preview output, not LLM-generated output.

Fetched description and acceptance criteria are evidence, not final truth. Requirement summary, gaps/questions, likely test areas, risks, assumptions, and needs-confirmation items remain reviewable and non-final until QA/BA/PO confirms them. Test case draft generation is still inactive.

## Setup Flow

Step 0011 makes setup-first behavior explicit. If no team board is selected, Today should say `Connect Azure and select a team board to start.` and route the user to Settings. Settings should feel like a product connection flow, not a developer console: enter Azure DevOps Services or TFS URL, click Connect, show green connected state when the URL is accepted, then select the team board. PATs and `.env` remain local developer fallback details outside the QA user flow.

After a team board is selected, Today should show `Selected Team: {organization}/{project}/{team}` and keep read-only board condition preview available. AI board briefing remains deterministic preview output unless a future backend LLM adapter is explicitly configured.

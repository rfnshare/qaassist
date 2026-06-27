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

Fetched description and acceptance criteria are evidence, not final truth. Requirement summary, gaps/questions, likely test areas, risks, assumptions, and needs-confirmation items remain reviewable and non-final until QA/BA/PO confirms them.

Step 0016 adds board knowledge metadata in Settings. Step 0017 adds manual-paste extraction preview for `.txt` and `.md` text. Step 0018 lets the user explicitly select metadata-only sources, the latest extraction preview, or a short user-confirmed note before Story analysis. Story analysis should distinguish Azure work item evidence, board knowledge metadata evidence, extracted preview evidence, user-confirmed notes, assumptions, and needs-confirmation items.

Step 0019 adds deterministic draft test case generation after Story analysis. Drafts must stay labeled as draft-only, cite evidence links, show warnings for missing/weak evidence, and avoid Azure Test Plans creation until a later explicit approval flow exists.

Step 0020 adds a local/session review workflow for generated drafts. QA can edit title, objective, steps, expected result, and reviewer note, then explicitly approve for later export, reject, or block each draft. Approval means ready for a future export flow only; it does not create Azure Test Plans items, save to a database, or write back to Azure. Evidence links and warnings remain visible during review.

Step 0021 adds an Azure Test Plans readiness preview after review validation. The Story tab can show eligible candidates, blocked items, missing non-secret plan/suite settings, required future confirmations, and a clear disclaimer. The UI must not show Create, Export, Send to Azure, or any equivalent write-back action in this step.

Step 0022 adds the first explicit Azure Test Plans creation flow. After readiness preview succeeds, no candidate is selected by default. QA must select exact candidates, check a final confirmation, and then click `Create selected in Azure Test Plans`. The UI must show created, failed, and skipped results clearly and must not imply story linking, bug creation, automation, comments, or database persistence.

Step 0023 adds optional backend-mediated AI assist as a separate suggestion layer after deterministic Story analysis. Settings shows provider status without secret inputs. Story keeps deterministic analysis primary, then enables `Request AI assist` only when the backend provider is available. Suggestions must remain clearly separate and must not regenerate drafts or trigger write-back automatically.

Step 0024 adds automation candidate mapping after review validation. The Story tab can map reviewed cases into planning-only UI, API, mixed, or manual-only candidates with readiness, reasons, blockers, and a recommended starting point. It must not show code generation, repository write, or CI/CD actions.

Step 0025 adds export/package review output. The Story tab can package selected current-session sections as Markdown or JSON, then let the user copy or download the artifact locally. Export is portable handoff output only; it must not write to Azure DevOps, Azure Test Plans, repositories, databases, or LLM providers.

Step 0026 adds Story/bug write-back helper previews. The Story tab can prepare bug draft, comment draft, state transition, and attachment metadata previews, but no live Azure DevOps write buttons are active. Helper output must say preview-only, show warnings and required confirmations, and keep final submission out of scope for this step.

Step 0027 expands optional backend-mediated AI refinement across deterministic outputs. Story AI assist remains separate, and draft cases, automation mapping, and write-back helper previews can each request AI suggestions only after their deterministic baseline exists. Suggestions render in separate cards, never auto-apply, never enable Azure/Test Plans actions, and must stay disabled or safely messaged when the provider is disabled or misconfigured.

Step 0028 adds an automation scaffold preview after automation mapping. The user selects candidates manually, chooses whether selector notes, test data notes, or API client shape should be included, and previews likely files/dependencies/gaps. No candidate is selected by default, no files are created, no repositories are written, and no CI/CD configuration is generated.

Step 0029 adds read-only team analytics to Today. Analytics summarize only current QA Assist session inputs, including board preview, reviewed cases, Test Plans readiness/creation outcomes, automation mapping/scaffold previews, exports, and write-back helper previews. Missing data is warned or skipped, never guessed, and no external systems are updated.

## Setup Flow

Step 0011 makes setup-first behavior explicit. If no team board is selected, Today should say `Connect Azure and select a team board to start.` and route the user to Settings. Settings should feel like a product connection flow, not a developer console: enter Azure DevOps Services or TFS URL, click Connect, show green connected state when the URL is accepted, then select the team board. PATs and `.env` remain local developer fallback details outside the QA user flow.

After a team board is selected, Today should show `Selected Team: {organization}/{project}/{team}` and keep read-only board condition preview available. AI board briefing remains deterministic preview output unless a future backend LLM adapter is explicitly configured.

Board Knowledge settings should show the selected team board scope and stay compact. The user can add metadata-only sources and optionally paste text for extraction preview, but QA Assist should not imply those documents have been uploaded, indexed, or automatically analyzed. Story should show that only selected evidence is included.

# Hallucination Guardrails

QA Assist should be evidence-bound and human-approved. It should not claim certainty when evidence is missing.

## Labels

- Source-backed: supported by fetched work item, board data, uploaded file, or linked evidence.
- User-confirmed: accepted or edited by the QA user.
- Assumption: inferred by QA Assist and not confirmed.
- Needs confirmation: open question or missing requirement.

## Rules

- Ask for missing requirements instead of inventing them.
- Keep open questions open until the user confirms the answer.
- Do not silently post to Azure DevOps, Azure Test Plans, bugs, comments, repos, or automation.
- Do not finalize test cases without QA approval.
- Generated test cases should later cite source references.
- Write-back requires explicit preview and confirmation.
- Board briefing output must cite returned board summary, work queue, or recommendation evidence for concrete work-item claims.
- Deterministic preview briefing must be labeled as preview output and still require user confirmation.
- Future LLM-assisted briefing must stay backend-mediated and must not treat unverified inference as fact.
- Story description, acceptance criteria, fields, and relations fetched in Step 0014 are evidence inputs only.
- Step 0015 deterministic Story analysis may summarize evidence and surface gaps/questions, but those outputs are not final facts. Gaps/questions, likely test areas, risks, assumptions, and needs-confirmation items need QA/BA/PO confirmation.
- Step 0016 board knowledge metadata is not analyzed content. Do not cite metadata-only sources as requirement evidence until content upload/indexing and user confirmation exist.
- Step 0017 extraction previews are extracted evidence previews only. Do not cite pasted text as final requirement truth, do not treat it as indexed knowledge, and do not include it in Story analysis until explicit evidence linking and user confirmation exist.
- Step 0018 linked board knowledge is user-selected context, not automatic truth. Metadata-only evidence must warn that content has not been extracted or analyzed, extracted preview evidence must warn that only capped preview text is included, and Story analysis must still require confirmation.
- Step 0019 draft test cases must cite evidence links, preserve uncertainty labels, warn when evidence is weak/missing, and remain draft-only until QA approves them.
- Step 0020 lets QA edit and approve drafts for later export, but approved-for-export still does not mean created in Azure Test Plans. Rejected and blocked cases are not export-ready. Evidence links and warnings must remain visible while reviewing.
- Step 0021 readiness preview can say a case is eligible for future Azure Test Plans creation, but it must also show blocked items, missing settings, required future confirmations, and the preview-only disclaimer. It must not imply that anything was sent to Azure.
- Step 0022 creation results must say exactly which selected test cases were created, failed, or skipped. Do not imply non-selected cases, blocked cases, story links, bugs, automation, or comments were created.
- Step 0023 LLM-assisted Story analysis is a separate suggestion layer on top of deterministic evidence. It must be labeled `llm-assisted`, keep deterministic analysis visible, avoid treating provider output as fact, and require QA confirmation.
- Step 0024 automation mapping may suggest UI, API, mixed, or manual-only readiness from reviewed case evidence, but it must not claim a case has an automation script, framework coverage, or CI readiness. Reasons and blockers must stay visible and planning-only.
- Step 0025 exports must preserve trust labels: deterministic evidence, AI-assisted suggestions, draft-only cases, reviewed local/session output, readiness preview-only output, explicit creation results, and automation planning-only output.
- Step 0026 write-back helper previews must preserve uncertainty and warnings. A bug, comment, state transition, or attachment metadata preview is not a submitted Azure DevOps change and must require future explicit confirmation.
- Step 0027 AI refinements are suggestion-only layers on deterministic outputs. They must be labeled `llm-assisted`, keep the deterministic baseline visible, avoid presenting provider suggestions as fact, and require QA to manually review anything useful.
- Test cases must not be treated as final outside Azure Test Plans until reviewed and confirmed by the QA user.

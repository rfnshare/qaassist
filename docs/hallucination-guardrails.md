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
- Test cases must not be generated or treated as final until a later confirmed-evidence workflow exists.

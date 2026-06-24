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

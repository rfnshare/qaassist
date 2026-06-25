# AI Board Briefing

AI board briefing is the future LLM-assisted summary for the selected team board. It should help QA engineers understand what changed, what needs QA attention, what is ready to retest, and what work should be handled first.

## Intended Output

The briefing should eventually explain:

- Board condition and meaningful changes since the last reviewed snapshot.
- Stories, bugs, or tasks that need QA attention.
- Resolved bugs ready to retest.
- My assigned QA work.
- Suggested next work and why it was suggested.
- Open assumptions, missing evidence, and needs-confirmation items.

## Evidence Labels

Briefing content must be labeled when the distinction matters:

- Source-backed: directly supported by Azure DevOps data or approved board knowledge.
- User-confirmed: confirmed by the QA engineer or team.
- Assumption: inferred by the assistant and not confirmed.
- Needs confirmation: useful but not ready to treat as fact.

## Step 0013 Scope

Step 0013 adds the first backend board briefing foundation. It uses deterministic preview logic over returned `BoardSummary`, `QaWorkQueue`, and `WorkRecommendation` evidence. It is not an LLM call and must not be described as LLM-generated.

The Today panel can generate an evidence-bound preview briefing after board condition has been fetched. The briefing highlights ready-to-retest work, assigned QA work, suggested next work, risks, assumptions, and needs-confirmation items. It does not invent story requirements or hidden context.

No LLM calls, prompt execution against a provider, storage, privacy filtering pipeline, model selection, or write-back are implemented in this step.

## Future Backend Direction

The briefing should be backend-mediated. Before sending content to an AI provider, QA Assist should minimize context, redact unnecessary sensitive details, preserve source references, and return structured output that the UI can render with evidence labels. The user remains the final authority before any recommendation, test case, write-back, or automation action is treated as approved.

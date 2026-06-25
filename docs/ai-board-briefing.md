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

## Step 0011 Scope

Step 0011 adds UI placeholders only. The Today panel shows AI board briefing as `LLM summary not active yet`, and Settings includes the AI Analysis configuration card.

No LLM calls, prompt execution, storage, privacy filtering, model selection, or generated briefing output are implemented in this step.

## Future Backend Direction

The briefing should be backend-mediated. Before sending content to an AI provider, QA Assist should minimize context, redact unnecessary sensitive details, preserve source references, and return structured output that the UI can render with evidence labels. The user remains the final authority before any recommendation, test case, write-back, or automation action is treated as approved.

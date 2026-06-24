# UX Workflow

QA Assist uses a simplified four-section side panel designed for a narrow browser extension window. The workflow should feel calm first, then progressively reveal deeper QA work only when the engineer asks for it.

## Primary Sections

1. Today helps the QA engineer orient quickly with setup status, future board summary placeholders, and one clear next action.
2. Story focuses on the currently detected Azure DevOps work item and future requirement review, scope, and test case approval.
3. Run prepares the future manual testing companion, evidence capture, bug creation, and automation candidate flow.
4. Settings keeps theme, Azure DevOps connection, board mapping, QA identity, Azure Test Plans, board knowledge, and privacy placeholders compact.

## Interaction Model

Each main section should have one large primary action. Secondary details live in compact cards so the panel does not feel like a dashboard squeezed into a drawer.

Progressive disclosure matters because QA Assist will eventually cover board awareness, story analysis, manual execution, bugs, UAT handoff, Azure Test Plans, and automation. The side panel should introduce those capabilities as a path, not as a wall of modules.

## Trust Rules

Preview values must be clearly labeled as preview-only or not connected until Azure DevOps fetch is implemented. Do not show fake counts, fake story titles, fake test cases, or fake analysis as real data.

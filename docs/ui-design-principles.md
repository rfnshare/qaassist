# UI Design Principles

QA Assist is a small-window assistant, not a full dashboard. The interface should lower cognitive load for QA engineers who are already juggling requirements, defects, releases, and developer conversations.

## Principles

1. Calm UI: use quiet color, clear spacing, and short copy so the panel feels supportive instead of noisy.
2. Focus: each screen should guide the user toward one immediate decision or action.
3. Whitespace: leave room around cards, actions, and status labels so the UI remains readable in a browser side panel.
4. Progressive disclosure: show the current step first and reveal deeper workflow details only when useful.
5. Trust labels: clearly mark placeholder, preview-only, and not-connected states.
6. No fake real data: never present sample counts, story details, analysis, or test cases as if they came from Azure DevOps.
7. Dark mode: support system, light, and dark modes through CSS variables.
8. One primary action: every main panel should have one visually dominant CTA.
9. Human confirmation: future write-back, test case creation, and automation flows must remain review-first and approval-first.
10. Lightweight motion: use CSS-only transitions for clarity, not entertainment.

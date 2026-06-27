# 0024 Automation Candidate Mapping

Implement Step 0024 from `develop` on `feature/0024-automation-candidate-mapping`.

Goal: map validated reviewed test cases into planning-only automation candidates. The step must not generate a Playwright framework, write code to local or remote repositories, create CI/CD pipelines, call LLM providers, or change Azure Test Plans behavior.

Required implementation:

- Add shared automation candidate contracts under `packages/shared/src/automation/automationCandidate.ts`.
- Add backend deterministic mapping service and route:
  - `POST /automation/candidates/map`
  - body: `reviewSession`, optional `mappingOptions.preferUi`, `preferApi`, `includeBlocked`
  - validate missing body, missing review session, `reviewedCases` array, and boolean options.
- Use conservative deterministic heuristics:
  - rejected/blocked cases are blocked and excluded by default.
  - UI/browser signals map toward `ui-playwright`.
  - API/service/endpoint/request/response signals map toward `api`.
  - both UI and API signals map toward `mixed`.
  - manual/external dependency/OTP/captcha/email/third-party signals block or make manual-only.
  - missing evidence links or vague steps prevent `ready`.
- Add Story-tab UI after review validation:
  - button `Map automation candidates`
  - options for prefer UI, prefer API, include blocked cases
  - render summary, candidates, blocked/manual-only cases, reasons, blockers, recommended starting point, and disclaimer.
- Keep the UI clearly labeled:
  - `Planning only - no automation code created.`

Documentation must explain that automation mapping is planning only, approved reviewed cases may still be non-automatable, manual-only and blocked cases remain possible, and future automation generation requires explicit later steps.

Verification:

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- focused diff over README, docs, apps, packages/shared, package files, and `.env.example`
- Safe API tests for health, validation failures, UI/API/mixed mapping, blocked-case defaults, include-blocked behavior, evidence readiness, manual dependency handling, and existing deterministic/review/readiness/create routes.

Do not commit Step 0024. Do not create Git tags. Do not include tag recommendations.

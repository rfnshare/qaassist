# Step 0028: Optional Automation Generation Scaffold

## Goal

Finalize Step 0027 if needed, then implement Step 0028: optional automation generation scaffold.

## Scope

Add a deterministic, local/session scaffold preview for selected automation candidates. The preview should show what files, helper shapes, dependencies, and gaps might exist later without creating a framework or writing files.

## Constraints

- Do not generate a full Playwright framework.
- Do not write code into external repos.
- Do not create CI/CD pipelines.
- Do not create actual files in the filesystem.
- Do not call LLMs.
- Do not call Azure DevOps.
- Do not require PATs.
- Do not persist scaffold output.
- Do not change Azure Test Plans behavior.
- Preserve existing deterministic and optional AI-assisted flows.
- Do not commit Step 0028.
- Do not create Git tags.

## Required Work

- Add shared automation scaffold contracts.
- Add backend `POST /automation/scaffold/preview`.
- Validate mapping result and selected candidate IDs.
- Use only selected candidates.
- Return preview files, dependencies, gaps, warnings, status, and disclaimer.
- Add extension API client function.
- Add Story UI scaffold preview section after automation mapping.
- Keep no candidates selected by default.
- Update docs and roadmap.

## Verification

- `npm run typecheck`
- `npm run build`
- `git ls-files apps/api/dist apps/extension/dist packages/shared/dist`
- `Get-ChildItem -Recurse -Force -Filter '.env'`
- `git status --short`
- `git diff --check`
- safe in-process API tests for validation, UI/API/mixed/manual-only candidates, and existing route compatibility

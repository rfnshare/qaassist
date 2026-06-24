# Auth Plan

## Azure DevOps

The production direction is Azure DevOps OAuth or another organization-approved delegated auth flow.

For local development only, PAT-based configuration may be allowed through backend environment variables. PATs must never be committed, stored in docs, or placed in the browser extension.

## LLM Providers

Production architecture should route LLM calls through the backend. LLM API keys should not live in the extension for production use.

Supported provider directions may include OpenAI, Azure OpenAI, or a company-approved model endpoint. Provider configuration should be environment-driven and never committed with real values.

## Token Reuse

QA Assist must not reuse Codex, ChatGPT, VS Code, browser, or unrelated application login tokens. Users should explicitly connect each supported service through approved auth flows.

## Secret Handling

- Do not commit secrets.
- Keep `.env.example` safe and placeholder-only.
- Prefer server-side secret storage for team or production use.
- Avoid storing story content longer than needed unless a future retention model is explicitly approved.
- Do not put production LLM keys in the browser extension.
- Store future integration tokens encrypted server-side with least-privilege scopes.
- Use explicit approval before any action that writes to Azure DevOps, Azure Test Plans, code repositories, or external systems.

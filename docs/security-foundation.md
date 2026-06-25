# Security Foundation

- Never commit secrets, tokens, API keys, customer data, or real credentials.
- Use `.env.example` only for placeholders. Real `.env` files stay ignored.
- Do not store production LLM keys in the browser extension.
- Use backend-mediated LLM access for product architecture.
- Store future tokens encrypted server-side with least-privilege scopes.
- For local development, Azure DevOps PATs stay in the API server environment only and must never be entered into extension settings.
- Product setup should use Azure/Microsoft delegated auth later. The extension may show connection status, discovered projects, discovered team boards, and selected team board, but it must not collect secrets.
- Step 0012 discovery routes are read-only and must not print PATs, Authorization headers, private work item content, or customer data.
- Keep browser host permissions limited to needed Azure DevOps domains.
- Do not silently exfiltrate board, story, file, or evidence data.
- Do not persist raw board/story data by default.
- Future audit logs should avoid raw story content by default.
- All write-back actions require explicit user approval.
- AI analysis, board knowledge upload, Azure Test Plans creation, bug creation, comments, and repository changes remain inactive until explicit review and approval flows exist.
- Step 0013 board briefing is deterministic preview logic unless a future backend LLM adapter is explicitly configured. The extension must not store AI keys or call model providers directly.

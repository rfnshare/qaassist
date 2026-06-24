# Security Foundation

- Never commit secrets, tokens, API keys, customer data, or real credentials.
- Use `.env.example` only for placeholders. Real `.env` files stay ignored.
- Do not store production LLM keys in the browser extension.
- Use backend-mediated LLM access for product architecture.
- Store future tokens encrypted server-side with least-privilege scopes.
- Keep browser host permissions limited to needed Azure DevOps domains.
- Do not silently exfiltrate board, story, file, or evidence data.
- Do not persist raw board/story data by default.
- Future audit logs should avoid raw story content by default.
- All write-back actions require explicit user approval.

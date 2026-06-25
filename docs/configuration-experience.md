# Configuration Experience

QA Assist setup should feel like connecting a product to Azure DevOps, not like configuring a developer sandbox.

## User Flow

1. The user enters an Azure DevOps Services or Team Foundation Server URL.
2. The user clicks Connect.
3. QA Assist validates the URL shape and shows Not connected, Connected, or Needs attention.
4. The user chooses organization, project, team, optional board, and optional iteration path.
5. QA Assist displays `Selected Team: {organization}/{project}/{team}`.
6. The user can click Change and update the selected team board.
7. Today, Story, Run, recommendations, board knowledge, and future test management defaults use the selected team board as their working scope.

## Step 0011 Scope

Step 0011 implements the extension-side shell for this flow. It can parse Azure DevOps Services URLs such as `https://dev.azure.com/your-org`, recognize legacy `visualstudio.com` organization URLs, and accept Team Foundation Server URLs as a connection mode. Manual team board entry remains the setup path until read-only discovery routes are implemented.

This step does not implement Microsoft Entra auth, OAuth, real organization discovery, team discovery, board discovery, Azure Test Plans write-back, file upload, database persistence, LLM calls, automation integration, or write-back.

## Local Development Fallback

Local development may still use the backend-only PAT fallback from the API server environment. That fallback is intentionally hidden behind advanced local development UI. QA users should not need to understand PATs, `.env`, or backend URLs in the production direction.

## Configuration Areas

- Connect Azure: server URL, connection status, and future OAuth entry point.
- Select Team Board: organization, project, team, board, and iteration path.
- QA Workflow: state mapping, current QA user, and assigned-to matching.
- Test Management: Azure Test Plans destination placeholders and approval-first create behavior.
- Board Knowledge: board-scoped requirement files, transcripts, BA Q&A, and product rules.
- AI Analysis: AI board briefing and story analysis placeholders with source labels.
- Automation: local repo, GitHub, Azure Repos, QA Assist-managed workspace, and manual export options.
- Privacy & Approval: no silent write-back, user confirmation, evidence-bound output, and future AI minimization/redaction.

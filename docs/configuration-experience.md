# Configuration Experience

QA Assist setup should feel like connecting a product to Azure DevOps, not like configuring a developer sandbox.

## User Flow

1. The user enters an Azure DevOps Services or Team Foundation Server URL.
2. The user clicks Connect.
3. QA Assist validates the URL shape through the backend and shows Not connected, Connecting, Connected, or Needs attention.
4. QA Assist discovers Azure DevOps Services projects when a backend token is available.
5. The user chooses a project.
6. QA Assist discovers team boards for that project.
7. The user chooses a team board.
8. QA Assist displays `Selected Team: {organization}/{project}/{team}`.
9. The user can click Change and update the selected team board.
10. Today, Story, Run, recommendations, board knowledge, and future test management defaults use the selected team board as their working scope.

## Step 0012 Scope

Step 0012 adds backend setup routes for read-only Azure DevOps Services project and team discovery. It parses Azure DevOps Services URLs such as `https://dev.azure.com/your-org`, recognizes legacy `visualstudio.com` organization URLs, and accepts HTTPS Team Foundation Server collection URLs as a setup shape.

TFS URL parsing is present so the product direction is clear, but full TFS discovery remains a later adapter capability because on-prem REST setup can differ by collection and version.

This step does not implement Microsoft Entra auth, OAuth, Azure Test Plans write-back, file upload, database persistence, LLM calls, automation integration, or write-back.

## Local Development Fallback

Local development may still use the backend-only PAT fallback from the API server environment. If the backend token is missing, discovery returns a safe message and the extension leaves manual setup under `Advanced local preview`. QA users should not need to understand PATs, `.env`, or backend URLs in the production direction.

## Configuration Areas

- Connect Azure: server URL, connection status, and future OAuth entry point.
- Select Team Board: organization, project, team, board, and iteration path.
- QA Workflow: state mapping, current QA user, and assigned-to matching.
- Test Management: Azure Test Plans destination placeholders and approval-first create behavior.
- Board Knowledge: board-scoped requirement files, transcripts, BA Q&A, and product rules.
- AI Analysis: AI board briefing and story analysis placeholders with source labels.
- Automation: local repo, GitHub, Azure Repos, QA Assist-managed workspace, and manual export options.
- Privacy & Approval: no silent write-back, user confirmation, evidence-bound output, and future AI minimization/redaction.

## Board Knowledge Metadata

Step 0016 makes Board Knowledge a metadata-only configuration shell scoped to the selected team board. Users can add source type, title, description, tags, and optional file metadata such as name, type, and size.

File contents are not read, uploaded, parsed, indexed, or sent to an LLM in this step. Added sources are configuration evidence only and must not be treated as analyzed requirement knowledge until a later upload/indexing and confirmation workflow exists.

# Azure DevOps Settings Strategy

## Azure Setup

Settings should support Azure organization, project, board, team, sprint/iteration, and Azure Test Plans destination.

Step 0008 introduces shared contracts for `AzureDevOpsBoardIdentity`, `BoardSelection`, state mapping settings, current QA user settings, Azure Test Plans destination settings, board knowledge files, board summaries, work queues, and explainable work recommendations. These contracts define the future settings model before any Azure fetch or storage is implemented.

Step 0009 adds the first local read-only settings flow in the extension. The extension stores only non-secret values: API base URL, organization, project, optional team, optional iteration path, and optional current QA user. The Azure DevOps PAT remains on the backend in local `.env`.

Step 0011 changes the setup experience into a user-facing connection shell:

- The user enters an Azure DevOps Services or Team Foundation Server URL.
- The user clicks Connect.
- QA Assist shows Not connected, Connected, or Needs attention.
- The user selects organization, project, team, optional board, and optional iteration path.
- The selected team displays as `Selected Team: {organization}/{project}/{team}`.
- The user can change the selected team board.

Real organization/project/team discovery is deferred. Until discovery routes exist, the extension supports manual non-secret fields and keeps the local API base URL in an advanced local development area. QA users should not need PATs, `.env`, or backend URL knowledge in the production direction.

## State Mapping

Later, QA Assist should fetch available Azure DevOps states and let the user map:

- In QA.
- Ready to Test.
- Resolved.
- Blocked.
- Ready for UAT.

Step 0009 exposes a read-only `/azure-devops/states` backend route that fetches available states by work item type. Saving state mappings remains future work.

## Current QA User

Later, Microsoft/Azure identity should identify the current QA user. Early product settings may support configured QA user or assigned-to override. Assigned-to is a signal, not the only truth.

## Board Knowledge

Requirement files, transcripts, notes, and Q&A must be scoped to the selected board.

## Test Management

Azure Test Plans is first when Azure is configured. Later targets include TestRail, Zephyr, Markdown, and export.

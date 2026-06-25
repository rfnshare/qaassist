# Product Plan

QA Assist is an embedded QA command center for QA engineers. The first vehicle is a Chrome/Edge browser extension inside Azure DevOps Boards, with Azure Test Plans as the first test management target once Azure is configured.

## Product Model

QA Assist should feel like a QA cockpit, not a separate dashboard. The user should stay in Azure DevOps while the assistant helps them understand board condition, select work, clarify requirements, build scope, create source-of-truth test cases, execute manual testing, prepare bugs, and later connect Playwright automation.

## Core Surfaces

- QA Command Center: board summary, assigned work, resolved bugs ready to test, mail/update placeholder, and suggested next work.
- Work Queue: assigned stories, bugs ready to test, prioritization explanation, and future ranking by priority, severity, story points, age, assignment, and release risk.
- Story Workspace: detected Azure DevOps context, requirement sufficiency, assistant discussion loop, source/context panel, and open questions.
- Board Brain: future board-scoped requirement memory using uploaded requirements, meeting transcripts, Q&A, and product notes.
- Scope Builder: draft scope, user-confirmed scope, exclusions, assumptions, and risk areas.
- Test Case Source Of Truth: approved test cases designed for humans, Azure Test Plans, and future automation.
- Manual Testing Companion: guided execution, notes, evidence, bug creation from current context, retest, and UAT handoff.
- Automation Workspace: Playwright first, API automation later, and repo access modes for local repo, GitHub, Azure Repos, QA Assist-managed workspace, or manual export.

## Accepted Decisions

- Azure DevOps Boards is first platform.
- Azure Test Plans is first test management target when Azure is configured.
- Setup should feel like a product connection flow: enter Azure DevOps Services or TFS URL, connect, choose organization/project/team board, show `Selected Team: {organization}/{project}/{team}`, and allow change.
- Later test targets include TestRail, Zephyr, custom Markdown, and export.
- Azure state mapping will be configurable for In QA, Ready to Test, Resolved, Blocked, and Ready for UAT.
- Current QA user detection will later use Microsoft/Azure identity; early settings may use configured QA user or assigned-to override.
- Assigned-to is one signal, not the only truth.
- Requirement files and board memory are scoped to the selected board.
- Suggestions are not final. User confirmation is final.
- Nothing writes back to Azure DevOps, Azure Test Plans, bugs, comments, repositories, or automation without explicit approval.

## Configuration Shell

Step 0011 introduces the product configuration shell inside Settings. It keeps the four-section side panel but organizes setup into Connect Azure, Select Team Board, QA Workflow, Test Management, Board Knowledge, AI Analysis, Automation, and Privacy & Approval cards. The shell does not implement OAuth, discovery, uploads, LLM calls, write-back, or automation. It makes the future path visible without asking QA users to understand backend URLs, PATs, or `.env` files.

Azure projects can have multiple team boards, so project selection alone is not enough. QA Assist should treat the selected team board as the working scope for Today, Story, Run, recommendations, board knowledge, and future test management defaults.

## Board Awareness Contracts

The simplified Today view will eventually be backed by shared contracts:

- `BoardSummary` for selected-board condition, state buckets, data freshness, my work, resolved bugs ready to retest, and open risks.
- `QaWorkQueue` for bucketed work items and safe work-item summaries.
- `WorkRecommendation` for explainable suggested next work that still requires user confirmation.

These contracts do not fetch real Azure DevOps data yet. They prepare the data model for the next Azure board fetch step without allowing fake UI counts or automatic work selection.

## Safety Principle

QA Assist must be evidence-bound and human-approved. Generated content should be labeled as source-backed, user-confirmed, assumption, or needs confirmation. Open questions remain open until the user confirms the answer.

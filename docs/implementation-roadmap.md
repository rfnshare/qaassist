# Implementation Roadmap

## Completed

- 0001 Project foundation.
- 0002 Extension shell.
- 0003 Backend API skeleton.
- 0004 Shared contracts.
- 0005 Azure DevOps URL-only page detection.
- 0006 Product replan, security foundation, and QA cockpit UI shell.
- 0007 Simplified UI redesign and dark mode.
- 0008 Board/work summary contracts.
- 0009 Azure DevOps settings and board summary fetch.
- 0010 Azure preview validation and Today UI refinement.

## 0011 Seamless Azure Setup And Configuration Shell

Implemented for review in Step 0011.

Make Settings feel like a product setup hub: connect Azure DevOps Services or TFS by URL, show connection state, select a project/team board, expose configuration placeholders for QA workflow, Azure Test Plans, board knowledge, AI analysis, automation, privacy, and approval, and keep Today setup-first when no team board is selected.

## 0012 Azure Connection And Team Discovery Routes

Add safe read-only backend routes for Azure organization, project, team, board, iteration, and state discovery. Keep OAuth design separate from local PAT fallback.

## 0013 AI Board Briefing Backend Design

Design backend-mediated AI board briefing with source labels, privacy filtering, structured output, and no write-back.

## 0014 Work Item Detail Fetch

Fetch selected story/bug detail through the backend and normalize it into shared contracts.

## 0015 State Mapping Save And Board Setup Hardening

Persist user-approved Azure DevOps state mappings, improve board/team selection, and harden setup validation.

## 0016 Board-Wise Knowledge/File Upload Design

Design board-scoped uploaded requirement, transcript, Q&A, and product-note knowledge boundaries.

## 0017 Story Workspace Requirement Discussion

Add human-in-the-loop requirement clarification with evidence labels and open-question tracking.

## 0018 Scope Builder And Confirmation Flow

Build draft scope, confirmed scope, assumptions, exclusions, and approval state.

## 0019 Test Case Source-Of-Truth Generation

Generate reviewable test cases from confirmed scope and source references.

## 0020 Azure Test Plans Write-Back

Push approved test cases to Azure Test Plans only after explicit user confirmation.

## 0021 Manual Testing Companion

Guide manual execution, capture notes/evidence, and support retest/UAT handoff.

## 0022 Bug Creation Flow

Create Azure DevOps bugs from current context only after user review and confirmation.

## 0023 Playwright Framework Integration

Connect approved test cases to Playwright automation candidates and repository modes.

## 0024 Automation Generation/Execution/CI

Generate, run, maintain, and connect automation with CI only through explicit user approval.

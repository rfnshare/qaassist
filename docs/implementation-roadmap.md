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

## 0009 Azure DevOps Settings And Board Summary Fetch

Implemented for review in Step 0009.

Add backend-only Azure DevOps PAT configuration, read-only state fetch, read-only board summary preview through WIQL and Work Items Batch, extension non-secret Azure settings, and a Today action to fetch real board summary data when configured.

## 0010 Work Item Detail Fetch

Fetch selected story/bug detail through the backend and normalize it into shared contracts.

## 0011 State Mapping Save And Board Setup Hardening

Persist user-approved Azure DevOps state mappings, improve board/team selection, and harden setup validation.

## 0012 Board-Wise Knowledge/File Upload Design

Design board-scoped uploaded requirement, transcript, Q&A, and product-note knowledge boundaries.

## 0013 Story Workspace Requirement Discussion

Add human-in-the-loop requirement clarification with evidence labels and open-question tracking.

## 0014 Scope Builder And Confirmation Flow

Build draft scope, confirmed scope, assumptions, exclusions, and approval state.

## 0015 Test Case Source-Of-Truth Generation

Generate reviewable test cases from confirmed scope and source references.

## 0016 Azure Test Plans Write-Back

Push approved test cases to Azure Test Plans only after explicit user confirmation.

## 0017 Manual Testing Companion

Guide manual execution, capture notes/evidence, and support retest/UAT handoff.

## 0018 Bug Creation Flow

Create Azure DevOps bugs from current context only after user review and confirmation.

## 0019 Playwright Framework Integration

Connect approved test cases to Playwright automation candidates and repository modes.

## 0020 Automation Generation/Execution/CI

Generate, run, maintain, and connect automation with CI only through explicit user approval.

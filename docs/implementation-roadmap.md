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

## 0010 Azure Preview Validation And Today UI Refinement

Implemented for review in Step 0010.

Add a manual Azure validation guide, harden preview mapper behavior for malformed optional fields, and refine the Today/Settings UI for real board preview data while keeping Azure DevOps interactions read-only.

## 0011 Work Item Detail Fetch

Fetch selected story/bug detail through the backend and normalize it into shared contracts.

## 0012 State Mapping Save And Board Setup Hardening

Persist user-approved Azure DevOps state mappings, improve board/team selection, and harden setup validation.

## 0013 Board-Wise Knowledge/File Upload Design

Design board-scoped uploaded requirement, transcript, Q&A, and product-note knowledge boundaries.

## 0014 Story Workspace Requirement Discussion

Add human-in-the-loop requirement clarification with evidence labels and open-question tracking.

## 0015 Scope Builder And Confirmation Flow

Build draft scope, confirmed scope, assumptions, exclusions, and approval state.

## 0016 Test Case Source-Of-Truth Generation

Generate reviewable test cases from confirmed scope and source references.

## 0017 Azure Test Plans Write-Back

Push approved test cases to Azure Test Plans only after explicit user confirmation.

## 0018 Manual Testing Companion

Guide manual execution, capture notes/evidence, and support retest/UAT handoff.

## 0019 Bug Creation Flow

Create Azure DevOps bugs from current context only after user review and confirmation.

## 0020 Playwright Framework Integration

Connect approved test cases to Playwright automation candidates and repository modes.

## 0021 Automation Generation/Execution/CI

Generate, run, maintain, and connect automation with CI only through explicit user approval.

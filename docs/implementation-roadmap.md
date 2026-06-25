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
- 0011 Seamless Azure setup and configuration shell.
- 0012 Azure connection and team discovery routes.
- 0013 Evidence-bound AI board briefing foundation.

## 0014 Azure Work Item Detail Fetch And Story Workspace Foundation

Implemented for review in Step 0014.

Add shared work item detail contracts, a backend read-only Azure DevOps work item detail fetch route, and a Story workspace foundation that displays source-backed fields, safe description/acceptance criteria previews, relation summaries, and inactive requirement/gap/test-scope placeholders. No LLM analysis, write-back, comments, bug creation, Azure Test Plans creation, or generated test cases are active yet.

## 0015 Requirement/Gap Analysis Deterministic Foundation

Add deterministic source-backed requirement summary and gap/question extraction from confirmed work item evidence. Keep all analysis reviewable and non-final until user confirmation.

## 0016 Board Knowledge/Upload Foundation

Design the first board-scoped requirement, transcript, Q&A, and product-note upload boundaries.

## 0017 Test Case Draft Generation From Confirmed Requirement Evidence

Generate reviewable test case drafts only from confirmed requirement evidence and source labels.

## 0018 Optional Backend LLM Provider Adapter

Add optional backend-mediated LLM provider abstraction for approved AI workflows. The extension must not hold AI keys.

## 0019 State Mapping Save And Board Setup Hardening

Persist user-approved Azure DevOps state mappings, improve board/team selection, and harden setup validation.

## 0020 Story Workspace Requirement Discussion

Add human-in-the-loop requirement clarification with evidence labels and open-question tracking.

## 0021 Scope Builder And Confirmation Flow

Build draft scope, confirmed scope, assumptions, exclusions, and approval state.

## 0022 Test Case Source-Of-Truth Generation

Generate reviewable test cases from confirmed scope and source references.

## 0023 Azure Test Plans Write-Back

Push approved test cases to Azure Test Plans only after explicit user confirmation.

## 0024 Manual Testing Companion

Guide manual execution, capture notes/evidence, and support retest/UAT handoff.

## 0025 Bug Creation Flow

Create Azure DevOps bugs from current context only after user review and confirmation.

## 0026 Playwright Framework Integration

Connect approved test cases to Playwright automation candidates and repository modes.

## 0027 Automation Generation/Execution/CI

Generate, run, maintain, and connect automation with CI only through explicit user approval.

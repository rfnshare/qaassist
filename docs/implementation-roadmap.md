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
- 0014 Azure work item detail fetch and Story workspace foundation.
- 0015 Deterministic requirement and gap analysis for Story workspace.

## 0016 Board Knowledge And Requirement Upload Foundation

Implemented for review in Step 0016.

Add shared board knowledge metadata contracts, backend metadata-only validation/summary routes, and Settings UI for selected-board-scoped knowledge source metadata. No file content upload, parsing, indexing, LLM ingestion, write-back, comments, bug creation, Azure Test Plans creation, or generated test cases are active yet.

## 0017 Safe File Upload/Content Extraction Design

Design safe content upload, extraction, retention, access boundaries, and indexing review before any document text can be used as evidence.

## 0018 Test Case Draft Generation From Confirmed Evidence

Generate reviewable test case drafts only from confirmed requirement evidence and source labels.

## 0019 Optional Backend LLM Provider Adapter

Add optional backend-mediated LLM provider abstraction for approved AI workflows. The extension must not hold AI keys.

## 0020 Azure Test Plans Draft/Write-Back Approval Flow

Draft Azure Test Plans write-back previews from confirmed test cases and require explicit approval before creation.

## 0021 State Mapping Save And Board Setup Hardening

Persist user-approved Azure DevOps state mappings, improve board/team selection, and harden setup validation.

## 0022 Story Workspace Requirement Discussion

Add human-in-the-loop requirement clarification with evidence labels and open-question tracking.

## 0023 Scope Builder And Confirmation Flow

Build draft scope, confirmed scope, assumptions, exclusions, and approval state.

## 0024 Test Case Source-Of-Truth Generation

Generate reviewable test cases from confirmed scope and source references.

## 0025 Azure Test Plans Write-Back

Push approved test cases to Azure Test Plans only after explicit user confirmation.

## 0026 Manual Testing Companion

Guide manual execution, capture notes/evidence, and support retest/UAT handoff.

## 0027 Bug Creation Flow

Create Azure DevOps bugs from current context only after user review and confirmation.

## 0028 Playwright Framework Integration

Connect approved test cases to Playwright automation candidates and repository modes.

## 0029 Automation Generation/Execution/CI

Generate, run, maintain, and connect automation with CI only through explicit user approval.

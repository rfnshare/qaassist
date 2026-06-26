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
- 0016 Board knowledge and requirement upload foundation.
- 0017 Safe text extraction preview for board knowledge.

## 0018 Board Knowledge Evidence Linking To Story Analysis

Implemented for review in Step 0018.

Add explicit user-selected linked evidence for Story analysis. Metadata-only sources, capped extraction preview evidence, and user-confirmed notes can be included in deterministic Story analysis with evidence coverage, warnings, assumptions, and needs-confirmation output.

## 0019 Test Case Draft Generation From Confirmed Evidence

Generate reviewable test case drafts only from confirmed requirement evidence and source labels.

## 0020 Optional Backend LLM Provider Adapter

Add optional backend-mediated LLM provider abstraction for approved AI workflows. The extension must not hold AI keys.

## 0021 Azure Test Plans Draft/Write-Back Approval Flow

Draft Azure Test Plans write-back previews from confirmed test cases and require explicit approval before creation.

## 0022 State Mapping Save And Board Setup Hardening

Persist user-approved Azure DevOps state mappings, improve board/team selection, and harden setup validation.

## 0023 Story Workspace Requirement Discussion

Add human-in-the-loop requirement clarification with evidence labels and open-question tracking.

## 0024 Scope Builder And Confirmation Flow

Build draft scope, confirmed scope, assumptions, exclusions, and approval state.

## 0025 Test Case Source-Of-Truth Generation

Generate reviewable test cases from confirmed scope and source references.

## 0026 Azure Test Plans Write-Back

Push approved test cases to Azure Test Plans only after explicit user confirmation.

## 0027 Manual Testing Companion

Guide manual execution, capture notes/evidence, and support retest/UAT handoff.

## 0028 Bug Creation Flow

Create Azure DevOps bugs from current context only after user review and confirmation.

## 0029 Playwright Framework Integration

Connect approved test cases to Playwright automation candidates and repository modes.

## 0030 Automation Generation/Execution/CI

Generate, run, maintain, and connect automation with CI only through explicit user approval.

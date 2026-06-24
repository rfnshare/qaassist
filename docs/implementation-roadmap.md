# Implementation Roadmap

## Completed

- 0001 Project foundation.
- 0002 Extension shell.
- 0003 Backend API skeleton.
- 0004 Shared contracts.
- 0005 Azure DevOps URL-only page detection.
- 0006 Product replan, security foundation, and QA cockpit UI shell.

## 0007 Simplified UI Redesign And Dark Mode

Implemented for review in Step 0007.

Simplify the extension side panel into Today, Story, Run, and Settings sections. Add a calm small-window-first visual system, one primary action per main screen, clear preview labels, and system/light/dark theme support.

## 0008 Board/Work Summary Contracts

Add contracts for board summary, work queue, state mapping, user signals, and preview-safe board condition data.

## 0009 Azure DevOps Settings And Board Summary Fetch

Add Azure DevOps settings, board/project selection, state mapping, and safe board summary fetch.

## 0010 Work Item Detail Fetch

Fetch selected story/bug detail through the backend and normalize it into shared contracts.

## 0011 Board-Wise Knowledge/File Upload Design

Design board-scoped uploaded requirement, transcript, Q&A, and product-note knowledge boundaries.

## 0012 Story Workspace Requirement Discussion

Add human-in-the-loop requirement clarification with evidence labels and open-question tracking.

## 0013 Scope Builder And Confirmation Flow

Build draft scope, confirmed scope, assumptions, exclusions, and approval state.

## 0014 Test Case Source-Of-Truth Generation

Generate reviewable test cases from confirmed scope and source references.

## 0015 Azure Test Plans Write-Back

Push approved test cases to Azure Test Plans only after explicit user confirmation.

## 0016 Manual Testing Companion

Guide manual execution, capture notes/evidence, and support retest/UAT handoff.

## 0017 Bug Creation Flow

Create Azure DevOps bugs from current context only after user review and confirmation.

## 0018 Playwright Framework Integration

Connect approved test cases to Playwright automation candidates and repository modes.

## 0019 Automation Generation/Execution/CI

Generate, run, maintain, and connect automation with CI only through explicit user approval.

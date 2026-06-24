# Implementation Roadmap

## 0001 Project Foundation

Create documentation, project rules, git workflow notes, architecture direction, auth plan, decision log, and prompt log. Do not add runtime application code.

## 0002 Extension Shell

Create the Chrome/Edge Manifest V3 extension shell with side panel UI, setup placeholder, story detected placeholder, analysis placeholder, settings placeholder, service worker, and content script.

## 0003 API Skeleton

Add a small TypeScript backend API with health check, version endpoint, config loading, development CORS, and standard error shape.

## 0004 Shared Contracts

Add shared TypeScript contracts and runtime validation schemas for work item context and QA analysis output.

## 0005 Azure DevOps Work Item Detection

Detect Azure DevOps work item pages in the extension and show parsed source, organization, project, and work item ID.

## 0006 Azure DevOps Fetch

Fetch Azure DevOps work item data through the backend using local development PAT configuration only. Normalize the result into shared contracts.

## 0007 LLM Gateway

Add backend LLM provider abstraction, mock provider, and a mock `POST /qa/analyze-story` endpoint.

## 0008 QA Analysis Engine

Add prompt templates, structured output validation, Markdown rendering, and optional real provider configuration when safe.

## 0009 Analysis UI

Build the extension analysis UI with tabs for overview, questions, test scope, test cases, regression, automation, UAT notes, and Markdown copy.

## 0010 Post Comment

Allow explicit user-reviewed posting of generated QA analysis Markdown as an Azure DevOps work item comment.

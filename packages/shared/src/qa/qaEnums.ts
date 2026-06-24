export type QaReadiness = "low" | "medium" | "high";

export type QaPriority = "low" | "medium" | "high";

export type QaRiskLevel = "low" | "medium" | "high";

export type QaAutomatable = "yes" | "no" | "maybe";

export type QaQuestionOwner =
  | "BA/Product"
  | "Developer"
  | "QA"
  | "UX"
  | "Support"
  | "Unknown";

export type QaTestCaseType =
  | "functional"
  | "negative"
  | "edge"
  | "regression"
  | "permission"
  | "integration"
  | "ui"
  | "api"
  | "data";

export type QaAutomationCandidateType =
  | "playwright-ui"
  | "api"
  | "manual-only"
  | "later";

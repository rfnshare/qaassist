export const TEST_CASE_DRAFT_DISCLAIMER =
  "Draft test cases are generated from available evidence only and require QA review before use.";

export const MAX_TEST_CASE_DRAFTS = 8;

export const DEFAULT_DRAFT_INPUTS = {
  includePositivePath: true,
  includeNegativePath: true,
  includeRegression: true,
  includeLinkedKnowledge: false,
  includeUserConfirmedNotes: true
} as const;

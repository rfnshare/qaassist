import type { IsoDateTimeString } from "../common/timestamps.js";
import type {
  QaAutomatable,
  QaAutomationCandidateType,
  QaPriority,
  QaQuestionOwner,
  QaReadiness,
  QaRiskLevel
} from "./qaEnums.js";
import type { QaTestCase } from "./testCase.js";

export type QaRequirementSummary = {
  summary: string;
  readiness: QaReadiness;
  confidenceNotes: string[];
};

export type QaQuestion = {
  id: string;
  question: string;
  owner: QaQuestionOwner;
  priority: QaPriority;
  reason?: string;
};

export type QaImpactedArea = {
  name: string;
  riskLevel: QaRiskLevel;
  reason: string;
  suggestedChecks: string[];
};

export type QaTestScope = {
  inScope: string[];
  outOfScope: string[];
  assumptions: string[];
  requiredTestData: string[];
};

export type QaRegressionArea = {
  area: string;
  riskLevel: QaRiskLevel;
  reason: string;
  recommendedChecks: string[];
};

export type QaAutomationCandidate = {
  id: string;
  title: string;
  candidateType: QaAutomationCandidateType;
  automatable: QaAutomatable;
  reason: string;
  suggestedTool?: "playwright" | "api-test" | "manual";
  dependencies: string[];
};

export type QaUatHandoffNotes = {
  summary: string;
  checklist: string[];
  openRisks: string[];
  evidenceToAttach: string[];
};

export type QaAnalysisResult = {
  requirementSummary: QaRequirementSummary;
  assumptions: string[];
  missingQuestions: QaQuestion[];
  impactedAreas: QaImpactedArea[];
  testScope: QaTestScope;
  testCases: QaTestCase[];
  regressionScope: QaRegressionArea[];
  automationCandidates: QaAutomationCandidate[];
  uatHandoffNotes: QaUatHandoffNotes;
  markdownOutput: string;
  generatedAt?: IsoDateTimeString;
};

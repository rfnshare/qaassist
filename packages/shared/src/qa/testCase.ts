import type {
  QaAutomatable,
  QaPriority,
  QaRiskLevel,
  QaTestCaseType
} from "./qaEnums.js";

export type QaTestStep = {
  order: number;
  action: string;
  expectedResult: string;
};

export type QaTestCase = {
  id: string;
  title: string;
  type: QaTestCaseType;
  priority: QaPriority;
  riskLevel: QaRiskLevel;
  preconditions: string[];
  testData: string[];
  steps: QaTestStep[];
  expectedResult: string;
  automatable: QaAutomatable;
};

/**
 * PRSE - Principle of Recursive Systems Engineering
 * Type definitions for the PRSE capability
 */

import type { Evidence, Requirement, ExecutionTrace, StructuredJudgment, PatternRecord as CorePatternRecord } from "../types.js";
import type { ResourceBudget } from "../types.js";

// ============================================================
// PRSE Phases (Part 4)
// ============================================================

export type PRSEPhase =
  | "UNDERSTAND"
  | "DECONSTRUCT"
  | "DISCOVER"
  | "ARCHITECT"
  | "BUILD"
  | "EVALUATE"
  | "DIAGNOSE"
  | "IMPROVE"
  | "REPEAT"
  | "VALIDATE"
  | "RELEASE"
  | "EVOLVE";

export const PRSE_PHASES: PRSEPhase[] = [
  "UNDERSTAND",
  "DECONSTRUCT",
  "DISCOVER",
  "ARCHITECT",
  "BUILD",
  "EVALUATE",
  "DIAGNOSE",
  "IMPROVE",
  "REPEAT",
  "VALIDATE",
  "RELEASE",
  "EVOLVE"
];

// ============================================================
// Acceptance Criteria
// ============================================================

export interface AcceptanceCriterion {
  id: string;
  phase: PRSEPhase;
  name: string;
  description: string;
  weight: number; // 0-1
  mandatory: boolean;
  evaluate: (context: PRSEContext) => CriterionEvaluation;
}

export interface CriterionEvaluation {
  satisfied: boolean;
  score: number; // 0-1
  evidence: Evidence[];
  reasoning: string;
}

// ============================================================
// Iteration Tracking
// ============================================================

export interface PRSEIteration {
  id: string;
  iterationNumber: number;
  phase: PRSEPhase;
  startedAt: Date;
  completedAt?: Date;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "BLOCKED";
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  evaluations: CriterionEvaluation[];
  issuesFound: IdentifiedIssue[];
  correctionsApplied: Correction[];
  timeSpentMs: number;
}

export interface IdentifiedIssue {
  id: string;
  phase: PRSEPhase;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: "CORRECTNESS" | "RELIABILITY" | "EFFICIENCY" | "SECURITY" | "USABILITY" | "MAINTAINABILITY" | "ETHICAL" | "SUSTAINABILITY";
  description: string;
  rootCause?: string;
  evidence: Evidence[];
  affectedComponents: string[];
  detectionMethod: "EVALUATION" | "PATTERN_ANALYSIS" | "MANUAL_REVIEW" | "ADVERSARIAL_TEST";
  confidence: number;
}

export interface Correction {
  id: string;
  issueId: string;
  description: string;
  type: "FIX" | "REFACTOR" | "REDESIGN" | "ADD_TEST" | "ADD_EVIDENCE" | "REVISE_CRITERIA";
  appliedAt: Date;
  verificationResult?: "PASS" | "FAIL" | "PARTIAL";
  regressionRisk: "NONE" | "LOW" | "MEDIUM" | "HIGH";
}

// ============================================================
// PRSE Context
// ============================================================

export interface PRSEContext {
  objective: string;
  beneficiaries: string[];
  desiredOutcome: string;
  scope: string;
  constraints: Constraint[];
  assumptions: Assumption[];
  availableResources: ResourceBudget;
  currentPhase: PRSEPhase;
  iterationHistory: PRSEIteration[];
  evidence: Evidence[];
  requirements: Requirement[];
  patterns: PatternRecord[];
  judgments: StructuredJudgment[];
  trace?: ExecutionTrace;
}

export interface Constraint {
  id: string;
  type: "RESOURCE" | "TIME" | "COMPUTATIONAL" | "LEGAL" | "ETHICAL" | "SECURITY" | "FEASIBILITY" | "DEPENDENCY";
  description: string;
  severity: "HARD" | "SOFT";
  value?: number;
  unit?: string;
}

export interface Assumption {
  id: string;
  statement: string;
  confidence: number; // 0-1
  validated: boolean;
  validationEvidence?: Evidence[];
  impactIfWrong: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

// ============================================================
// PRSE Configuration
// ============================================================

export interface PRSEConfig {
  maxIterations: number;
  timeBudgetMs: number;
  computeBudgetUnits: number;
  minimumMandatoryScore: number;
  minimumOverallScore: number;
  requireAllMandatory: boolean;
  enablePatternAnalysis: boolean;
  enableAdversarialTesting: boolean;
  stoppingConditions: StoppingCondition[];
}

export interface PRSEEngineOptions {
  config?: Partial<PRSEConfig>;
  evaluationEngine?: unknown;
  decisionEngine?: unknown;
  patternAnalysis?: unknown;
  memory?: unknown;
  outcomeGraph?: unknown;
}

export interface StoppingCondition {
  id: string;
  type: "ALL_MANDATORY_PASS" | "BUDGET_EXHAUSTED" | "NO_PROGRESS" | "MAX_ITERATIONS" | "EXTERNAL_BLOCKER";
  threshold?: number;
  description: string;
}

export const DEFAULT_PRSE_CONFIG: PRSEConfig = {
  maxIterations: 10,
  timeBudgetMs: 600000, // 10 minutes
  computeBudgetUnits: 1000,
  minimumMandatoryScore: 0.8,
  minimumOverallScore: 0.7,
  requireAllMandatory: true,
  enablePatternAnalysis: true,
  enableAdversarialTesting: false,
  stoppingConditions: [
    { id: "all-mandatory", type: "ALL_MANDATORY_PASS", description: "All mandatory criteria satisfied" },
    { id: "budget-time", type: "BUDGET_EXHAUSTED", threshold: 600000, description: "Time budget exhausted" },
    { id: "max-iterations", type: "MAX_ITERATIONS", threshold: 10, description: "Maximum iterations reached" },
    { id: "no-progress", type: "NO_PROGRESS", threshold: 3, description: "No meaningful progress in 3 iterations" }
  ]
};

// ============================================================
// Engineering Excellence Model (Part 8)
// ============================================================

export interface ExcellenceMetrics {
  verifiedValue: number; // 0-1
  reliability: number; // 0-1
  adaptability: number; // 0-1
  totalCost: number; // normalized 0-1
  residualRisk: number; // 0-1
  excellenceScore: number; // computed
}

export function calculateExcellence(metrics: Omit<ExcellenceMetrics, "excellenceScore">): ExcellenceMetrics {
  const { verifiedValue, reliability, adaptability, totalCost, residualRisk } = metrics;
  const numerator = verifiedValue * reliability * adaptability;
  const denominator = totalCost + residualRisk;
  const excellenceScore = denominator > 0 ? numerator / denominator : 0;
  return { ...metrics, excellenceScore };
}

// ============================================================
// Phase Outputs
// ============================================================

export interface PhaseOutput {
  phase: PRSEPhase;
  artifacts: Artifact[];
  decisions: PhaseDecision[];
  evidence: Evidence[];
  assumptionsValidated: string[];
  assumptionsInvalidated: string[];
  newQuestions: string[];
  riskAssessment: RiskAssessment;
}

export interface Artifact {
  id: string;
  type: string;
  name: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface PhaseDecision {
  id: string;
  phase: PRSEPhase;
  description: string;
  rationale: string;
  alternatives: string[];
  confidence: number;
  dependencies: string[];
  reversible: boolean;
}

export interface RiskAssessment {
  risks: IdentifiedRisk[];
  overallRiskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  mitigationStrategies: MitigationStrategy[];
}

export interface IdentifiedRisk {
  id: string;
  phase: PRSEPhase;
  likelihood: number; // 0-1
  impact: number; // 0-1
  description: string;
  category: "TECHNICAL" | "RESOURCE" | "SCHEDULE" | "SECURITY" | "COMPLIANCE" | "OPERATIONAL";
}

export interface MitigationStrategy {
  riskId: string;
  strategy: string;
  cost: number;
  effectiveness: number; // 0-1
  residualRisk: number; // 0-1
}

// ============================================================
// Evaluation Dimensions (Part 5)
// ============================================================

export type EvaluationDimension =
  | "CORRECTNESS"
  | "COMPLETENESS"
  | "RELIABILITY"
  | "ROBUSTNESS"
  | "EFFICIENCY"
  | "RESOURCE_CONSUMPTION"
  | "SECURITY"
  | "PRIVACY"
  | "USABILITY"
  | "ACCESSIBILITY"
  | "MAINTAINABILITY"
  | "EXTENSIBILITY"
  | "ETHICAL_COMPLIANCE"
  | "LEGAL_COMPLIANCE"
  | "SUSTAINABILITY"
  | "EDGE_CASE_HANDLING"
  | "FAILURE_RECOVERY"
  | "USER_EXPERIENCE";

export const EVALUATION_DIMENSIONS: EvaluationDimension[] = [
  "CORRECTNESS",
  "COMPLETENESS",
  "RELIABILITY",
  "ROBUSTNESS",
  "EFFICIENCY",
  "RESOURCE_CONSUMPTION",
  "SECURITY",
  "PRIVACY",
  "USABILITY",
  "ACCESSIBILITY",
  "MAINTAINABILITY",
  "EXTENSIBILITY",
  "ETHICAL_COMPLIANCE",
  "LEGAL_COMPLIANCE",
  "SUSTAINABILITY",
  "EDGE_CASE_HANDLING",
  "FAILURE_RECOVERY",
  "USER_EXPERIENCE"
];

// ============================================================
// Iteration Outcome
// ============================================================

export type IterationOutcome =
  | "PROGRESS"      // Measurable improvement demonstrated
  | "KNOWLEDGE"     // Consequential uncertainty reduced
  | "CORRECTION"    // Failure identified and addressed
  | "BLOCKED"       // Cannot proceed without external input
  | "EXHAUSTED"     // Budget exhausted
  | "COMPLETED";    // All mandatory criteria satisfied

export interface IterationSummary {
  iterationId: string;
  outcome: IterationOutcome;
  progressMetrics: Record<string, number>;
  issuesResolved: number;
  issuesNew: number;
  criteriaImproved: string[];
  criteriaRegressed: string[];
  evidenceCollected: number;
  timeSpentMs: number;
}

// Re-export PatternRecord from core types
export type PatternRecord = CorePatternRecord;
/**
 * PRSE - Principle of Recursive Systems Engineering
 * Type definitions for the PRSE capability
 */
import type { Evidence, Requirement, ExecutionTrace, StructuredJudgment, PatternRecord as CorePatternRecord } from "../types.js";
import type { ResourceBudget } from "../types.js";
export type PRSEPhase = "UNDERSTAND" | "DECONSTRUCT" | "DISCOVER" | "ARCHITECT" | "BUILD" | "EVALUATE" | "DIAGNOSE" | "IMPROVE" | "REPEAT" | "VALIDATE" | "RELEASE" | "EVOLVE";
export declare const PRSE_PHASES: PRSEPhase[];
export interface AcceptanceCriterion {
    id: string;
    phase: PRSEPhase;
    name: string;
    description: string;
    weight: number;
    mandatory: boolean;
    evaluate: (context: PRSEContext) => CriterionEvaluation;
}
export interface CriterionEvaluation {
    satisfied: boolean;
    score: number;
    evidence: Evidence[];
    reasoning: string;
}
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
    confidence: number;
    validated: boolean;
    validationEvidence?: Evidence[];
    impactIfWrong: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}
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
export declare const DEFAULT_PRSE_CONFIG: PRSEConfig;
export interface ExcellenceMetrics {
    verifiedValue: number;
    reliability: number;
    adaptability: number;
    totalCost: number;
    residualRisk: number;
    excellenceScore: number;
}
export declare function calculateExcellence(metrics: Omit<ExcellenceMetrics, "excellenceScore">): ExcellenceMetrics;
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
    likelihood: number;
    impact: number;
    description: string;
    category: "TECHNICAL" | "RESOURCE" | "SCHEDULE" | "SECURITY" | "COMPLIANCE" | "OPERATIONAL";
}
export interface MitigationStrategy {
    riskId: string;
    strategy: string;
    cost: number;
    effectiveness: number;
    residualRisk: number;
}
export type EvaluationDimension = "CORRECTNESS" | "COMPLETENESS" | "RELIABILITY" | "ROBUSTNESS" | "EFFICIENCY" | "RESOURCE_CONSUMPTION" | "SECURITY" | "PRIVACY" | "USABILITY" | "ACCESSIBILITY" | "MAINTAINABILITY" | "EXTENSIBILITY" | "ETHICAL_COMPLIANCE" | "LEGAL_COMPLIANCE" | "SUSTAINABILITY" | "EDGE_CASE_HANDLING" | "FAILURE_RECOVERY" | "USER_EXPERIENCE";
export declare const EVALUATION_DIMENSIONS: EvaluationDimension[];
export type IterationOutcome = "PROGRESS" | "KNOWLEDGE" | "CORRECTION" | "BLOCKED" | "EXHAUSTED" | "COMPLETED";
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
export type PatternRecord = CorePatternRecord;
//# sourceMappingURL=types.d.ts.map
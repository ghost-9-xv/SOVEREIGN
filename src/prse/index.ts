/**
 * PRSE - Principle of Recursive Systems Engineering
 * Main entry point for the PRSE capability
 */

export type {
  PRSEPhase,
  PRSEConfig,
  PRSEContext,
  PRSEIteration,
  AcceptanceCriterion,
  CriterionEvaluation,
  IdentifiedIssue,
  Correction,
  PhaseOutput,
  PhaseDecision,
  RiskAssessment,
  IdentifiedRisk,
  MitigationStrategy,
  EvaluationDimension,
  IterationOutcome,
  IterationSummary,
  Constraint,
  Assumption,
  StoppingCondition,
  ExcellenceMetrics,
  PRSEEngineOptions,
  PatternRecord
} from "./types.js";

export {
  PRSEEngine,
  DEFAULT_PRSE_CONFIG,
  PRSE_PHASES,
  EVALUATION_DIMENSIONS,
  calculateExcellence
} from "./engine.js";

/**
 * SOVEREIGN - AI Agent Augmentation Framework
 * Main entry point
 */
export type { TaskState, RequirementType, Requirement, EvidenceType, Evidence, UncertaintyResponse, Discipline, ExpertiseSpecification, Decision, ToolContract, ToolError, ResourceLimits, ExecutionTrace, ToolCall, Artifact, ExecutionError, ResourceUsage, JudgmentType, ChoiceJudgment, ScoreJudgment, RubricLevel, NoulJudgment, StructuredJudgment, DecisionContract, DecisionPolicy, EscalationRule, AutomationRule, CompletionVerdict, PolicyComplianceVerdict, EvaluationResult, ExecutionQualityScores, PatternCategory, PatternStatus, PatternRecord, MemoryCategory, MemoryRecord, NodeType, RelationshipType, GraphNode, GraphEdge, ImprovementProposal, Permission, AuthorizationRequest, ResourceBudget, EscalationTrigger } from "./types.js";
export { FailureCategory, FAILURE_CATEGORIES, isTerminalState, isProgressState, DEFAULT_RESOURCE_BUDGET } from "./types.js";
export { TaskManager } from "./task-manager.js";
export type { Task } from "./task-manager.js";
export type { ExecutionEngineOptions, ToolExecutor, AuthorizationManager, EvidenceCollector } from "./execution-engine.js";
export { ExecutionEngine, DefaultToolExecutor, InMemoryAuthorizationManager, DefaultEvidenceCollector } from "./execution-engine.js";
export type { EvaluationPolicy, EvaluationCriterion, CriterionResult } from "./evaluation-engine.js";
export { EvaluationEngine, createDefaultEvaluationPolicy } from "./evaluation-engine.js";
export type { DecisionEngineOptions, JudgmentProvider } from "./decision-engine.js";
export { DecisionEngine, DeterministicProvider, createDefaultDecisionPolicy } from "./decision-engine.js";
export type { PatternAnalysisOptions, Observation, TrendAnalysis } from "./pattern-analysis.js";
export { PatternAnalysisEngine, createObservationFromTrace } from "./pattern-analysis.js";
export type { MemoryOptions, ConflictReport, CompoundedKnowledge, MemoryStats } from "./memory.js";
export { MemorySystem } from "./memory.js";
export type { OutcomeGraphOptions, DecisionPath, GraphPath, GraphStats } from "./outcome-graph.js";
export { OutcomeGraph } from "./outcome-graph.js";
export type { PRSEPhase, PRSEConfig, PRSEContext, PRSEIteration, AcceptanceCriterion, CriterionEvaluation, IdentifiedIssue, Correction, PhaseOutput, PhaseDecision, RiskAssessment, IdentifiedRisk, MitigationStrategy, EvaluationDimension, IterationOutcome, IterationSummary, Constraint, Assumption, StoppingCondition, ExcellenceMetrics } from "./prse/types.js";
export type { PRSEEngineOptions } from "./prse/types.js";
export { PRSEEngine, DEFAULT_PRSE_CONFIG, PRSE_PHASES, EVALUATION_DIMENSIONS, calculateExcellence } from "./prse/index.js";
import { TaskManager } from "./task-manager.js";
import { ExecutionEngine } from "./execution-engine.js";
import { EvaluationEngine } from "./evaluation-engine.js";
import { DecisionEngine } from "./decision-engine.js";
import { PatternAnalysisEngine } from "./pattern-analysis.js";
import { MemorySystem } from "./memory.js";
import { OutcomeGraph } from "./outcome-graph.js";
import { ResourceBudget, Permission } from "./types.js";
export interface SovereignConfig {
    resourceBudget?: Partial<ResourceBudget>;
    initialPermissions?: Permission[];
}
export declare class Sovereign {
    readonly taskManager: TaskManager;
    readonly executionEngine: ExecutionEngine;
    readonly evaluationEngine: EvaluationEngine;
    readonly decisionEngine: DecisionEngine;
    readonly patternAnalysis: PatternAnalysisEngine;
    readonly memory: MemorySystem;
    readonly outcomeGraph: OutcomeGraph;
    constructor(config?: SovereignConfig);
    registerTool(_name: string, contract: any, handler: (inputs: Record<string, unknown>) => Promise<Record<string, unknown>>): void;
    executeTask(objective: string, requirements?: any[]): Promise<any>;
    getStatus(): any;
    private getTaskStateCounts;
}
//# sourceMappingURL=index.d.ts.map
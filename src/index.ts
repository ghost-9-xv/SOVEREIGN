/**
 * SOVEREIGN - AI Agent Augmentation Framework
 * Main entry point
 */

// Core types - re-export types explicitly (excluding FailureCategory which is exported as value)
export type {
  TaskState,
  RequirementType,
  Requirement,
  EvidenceType,
  Evidence,
  UncertaintyResponse,
  Discipline,
  ExpertiseSpecification,
  Decision,
  ToolContract,
  ToolError,
  ResourceLimits,
  ExecutionTrace,
  ToolCall,
  Artifact,
  ExecutionError,
  ResourceUsage,
  JudgmentType,
  ChoiceJudgment,
  ScoreJudgment,
  RubricLevel,
  NoulJudgment,
  StructuredJudgment,
  DecisionContract,
  DecisionPolicy,
  EscalationRule,
  AutomationRule,
  CompletionVerdict,
  PolicyComplianceVerdict,
  EvaluationResult,
  ExecutionQualityScores,
  PatternCategory,
  PatternStatus,
  PatternRecord,
  MemoryCategory,
  MemoryRecord,
  NodeType,
  RelationshipType,
  GraphNode,
  GraphEdge,
  ImprovementProposal,
  Permission,
  AuthorizationRequest,
  ResourceBudget,
  EscalationTrigger
} from "./types.js";

// Core values - export as values (these are not types)
export {
  FailureCategory,
  FAILURE_CATEGORIES,
  isTerminalState,
  isProgressState,
  DEFAULT_RESOURCE_BUDGET
} from "./types.js";

// Task management - separate type and value exports
export { TaskManager } from "./task-manager.js";
export type { Task } from "./task-manager.js";

// Execution engine - explicit type exports
export type {
  ExecutionEngineOptions,
  ToolExecutor,
  AuthorizationManager,
  EvidenceCollector
} from "./execution-engine.js";
export {
  ExecutionEngine,
  DefaultToolExecutor,
  InMemoryAuthorizationManager,
  DefaultEvidenceCollector
} from "./execution-engine.js";

// Evaluation engine - explicit type exports
export type {
  EvaluationPolicy,
  EvaluationCriterion,
  CriterionResult
} from "./evaluation-engine.js";
export {
  EvaluationEngine,
  createDefaultEvaluationPolicy
} from "./evaluation-engine.js";

// Decision engine - explicit type exports
export type {
  DecisionEngineOptions,
  JudgmentProvider
} from "./decision-engine.js";
export {
  DecisionEngine,
  DeterministicProvider,
  createDefaultDecisionPolicy
} from "./decision-engine.js";

// Pattern analysis - explicit type exports
export type {
  PatternAnalysisOptions,
  Observation,
  TrendAnalysis
} from "./pattern-analysis.js";
export {
  PatternAnalysisEngine,
  createObservationFromTrace
} from "./pattern-analysis.js";

// Memory system - explicit type exports
export type {
  MemoryOptions,
  ConflictReport,
  CompoundedKnowledge,
  MemoryStats
} from "./memory.js";
export {
  MemorySystem
} from "./memory.js";

// Outcome graph - explicit type exports
export type {
  OutcomeGraphOptions,
  DecisionPath,
  GraphPath,
  GraphStats
} from "./outcome-graph.js";
export {
  OutcomeGraph
} from "./outcome-graph.js";

// PRSE - Principle of Recursive Systems Engineering
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
  ExcellenceMetrics
} from "./prse/types.js";
export type {
  PRSEEngineOptions
} from "./prse/types.js";
export {
  PRSEEngine,
  DEFAULT_PRSE_CONFIG,
  PRSE_PHASES,
  EVALUATION_DIMENSIONS,
  calculateExcellence
} from "./prse/index.js";

// Main SOVEREIGN class for easy usage
import { TaskManager } from "./task-manager.js";
import { ExecutionEngine, DefaultToolExecutor, InMemoryAuthorizationManager, DefaultEvidenceCollector } from "./execution-engine.js";
import { EvaluationEngine, createDefaultEvaluationPolicy } from "./evaluation-engine.js";
import { DecisionEngine, DeterministicProvider, createDefaultDecisionPolicy } from "./decision-engine.js";
import { PatternAnalysisEngine } from "./pattern-analysis.js";
import { MemorySystem } from "./memory.js";
import { OutcomeGraph } from "./outcome-graph.js";
import { ResourceBudget, DEFAULT_RESOURCE_BUDGET, Permission } from "./types.js";

function mergeBudget(base: ResourceBudget, overrides: Partial<ResourceBudget>): ResourceBudget {
  return {
    maxRepairIterations: overrides.maxRepairIterations ?? base.maxRepairIterations,
    timeBudgetMs: overrides.timeBudgetMs ?? base.timeBudgetMs,
    costBudgetUsd: overrides.costBudgetUsd ?? base.costBudgetUsd,
    toolCallLimit: overrides.toolCallLimit ?? base.toolCallLimit,
    modelCallLimit: overrides.modelCallLimit ?? base.modelCallLimit,
    memoryLimitMb: overrides.memoryLimitMb ?? base.memoryLimitMb,
    escalationTriggers: overrides.escalationTriggers ?? base.escalationTriggers
  };
}

export interface SovereignConfig {
  resourceBudget?: Partial<ResourceBudget>;
  initialPermissions?: Permission[];
}

export class Sovereign {
  public readonly taskManager: TaskManager;
  public readonly executionEngine: ExecutionEngine;
  public readonly evaluationEngine: EvaluationEngine;
  public readonly decisionEngine: DecisionEngine;
  public readonly patternAnalysis: PatternAnalysisEngine;
  public readonly memory: MemorySystem;
  public readonly outcomeGraph: OutcomeGraph;

  constructor(config: SovereignConfig = {}) {
    this.taskManager = new TaskManager({
      defaultBudget: mergeBudget(DEFAULT_RESOURCE_BUDGET, config.resourceBudget || {})
    });

    const toolExecutor = new DefaultToolExecutor();
    const authManager = new InMemoryAuthorizationManager(config.initialPermissions);
    const evidenceCollector = new DefaultEvidenceCollector();

    this.executionEngine = new ExecutionEngine({
      toolExecutor,
      authorizationManager: authManager,
      evidenceCollector,
      taskManager: this.taskManager
    });

    this.evaluationEngine = new EvaluationEngine(createDefaultEvaluationPolicy());

    const decisionProvider = new DeterministicProvider();
    this.decisionEngine = new DecisionEngine({
      providers: new Map([["deterministic", decisionProvider]]),
      defaultProvider: "deterministic",
      policy: createDefaultDecisionPolicy()
    });

    this.patternAnalysis = new PatternAnalysisEngine();
    this.memory = new MemorySystem();
    this.outcomeGraph = new OutcomeGraph();
  }

  registerTool(_name: string, contract: any, handler: (inputs: Record<string, unknown>) => Promise<Record<string, unknown>>): void {
    const toolExecutor = (this.executionEngine as any).options.toolExecutor;
    if (toolExecutor?.registerTool) {
      toolExecutor.registerTool(contract, handler);
    }
  }

  async executeTask(objective: string, requirements: any[] = []): Promise<any> {
    const task = this.taskManager.createTask(objective, requirements);

    const objectiveNode = this.outcomeGraph.createNode("OBJECTIVE", objective, { taskId: task.id });

    for (const req of requirements) {
      const reqNode = this.outcomeGraph.createNode("REQUIREMENT", req.description, req);
      this.outcomeGraph.linkObjectiveToRequirement(objectiveNode.id, reqNode.id);
    }

    const trace = await this.executionEngine.executeTask(task);

    const evaluation = this.evaluationEngine.evaluate(trace, requirements);

    this.memory.store({
      category: "EPISODIC",
      content: `Task executed: ${objective}`,
      source: "sovereign",
      context: "task-execution",
      scope: task.id,
      supportingEvidence: [],
      validationStatus: evaluation.completionVerdict === "SUCCESS" ? "VALIDATED" : "PENDING",
      confidence: evaluation.executionQualityScores.requirementSatisfaction,
      tags: ["task", evaluation.completionVerdict.toLowerCase()],
      revalidationConditions: []
    });

    return { task, trace, evaluation };
  }

  getStatus(): any {
    return {
      tasks: {
        total: this.taskManager.getAllTasks().length,
        byState: this.getTaskStateCounts()
      },
      memory: this.memory.getStats(),
      patterns: this.patternAnalysis.getPatterns().length,
      graph: this.outcomeGraph.getStats()
    };
  }

  private getTaskStateCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const task of this.taskManager.getAllTasks()) {
      counts[task.state] = (counts[task.state] || 0) + 1;
    }
    return counts;
  }
}
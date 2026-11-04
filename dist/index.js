/**
 * SOVEREIGN - AI Agent Augmentation Framework
 * Main entry point
 */
// Core values - export as values (these are not types)
export { FailureCategory, FAILURE_CATEGORIES, isTerminalState, isProgressState, DEFAULT_RESOURCE_BUDGET } from "./types.js";
// Task management - separate type and value exports
export { TaskManager } from "./task-manager.js";
export { ExecutionEngine, DefaultToolExecutor, InMemoryAuthorizationManager, DefaultEvidenceCollector } from "./execution-engine.js";
export { EvaluationEngine, createDefaultEvaluationPolicy } from "./evaluation-engine.js";
export { DecisionEngine, DeterministicProvider, createDefaultDecisionPolicy } from "./decision-engine.js";
export { PatternAnalysisEngine, createObservationFromTrace } from "./pattern-analysis.js";
export { MemorySystem } from "./memory.js";
export { OutcomeGraph } from "./outcome-graph.js";
export { PRSEEngine, DEFAULT_PRSE_CONFIG, PRSE_PHASES, EVALUATION_DIMENSIONS, calculateExcellence } from "./prse/index.js";
// Main SOVEREIGN class for easy usage
import { TaskManager } from "./task-manager.js";
import { ExecutionEngine, DefaultToolExecutor, InMemoryAuthorizationManager, DefaultEvidenceCollector } from "./execution-engine.js";
import { EvaluationEngine, createDefaultEvaluationPolicy } from "./evaluation-engine.js";
import { DecisionEngine, DeterministicProvider, createDefaultDecisionPolicy } from "./decision-engine.js";
import { PatternAnalysisEngine } from "./pattern-analysis.js";
import { MemorySystem } from "./memory.js";
import { OutcomeGraph } from "./outcome-graph.js";
import { DEFAULT_RESOURCE_BUDGET } from "./types.js";
function mergeBudget(base, overrides) {
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
export class Sovereign {
    taskManager;
    executionEngine;
    evaluationEngine;
    decisionEngine;
    patternAnalysis;
    memory;
    outcomeGraph;
    constructor(config = {}) {
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
    registerTool(_name, contract, handler) {
        const toolExecutor = this.executionEngine.options.toolExecutor;
        if (toolExecutor?.registerTool) {
            toolExecutor.registerTool(contract, handler);
        }
    }
    async executeTask(objective, requirements = []) {
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
    getStatus() {
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
    getTaskStateCounts() {
        const counts = {};
        for (const task of this.taskManager.getAllTasks()) {
            counts[task.state] = (counts[task.state] || 0) + 1;
        }
        return counts;
    }
}
//# sourceMappingURL=index.js.map
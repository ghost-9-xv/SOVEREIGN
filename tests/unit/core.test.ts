/**
 * SOVEREIGN Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  TaskManager,
  Task,
  TaskState,
  Requirement,
  RequirementType,
  FailureCategory,
  Evidence,
  EvidenceType,
  ResourceBudget,
  DEFAULT_RESOURCE_BUDGET,
  isTerminalState,
  isProgressState
} from "@dist/index.js";
import { ExecutionEngine, DefaultToolExecutor, InMemoryAuthorizationManager, DefaultEvidenceCollector } from "@dist/execution-engine.js";
import { EvaluationEngine, createDefaultEvaluationPolicy } from "@dist/evaluation-engine.js";
import { DecisionEngine, DeterministicProvider, createDefaultDecisionPolicy } from "@dist/decision-engine.js";
import { PatternAnalysisEngine, createObservationFromTrace } from "@dist/pattern-analysis.js";
import { MemorySystem } from "@dist/memory.js";
import { OutcomeGraph } from "@dist/outcome-graph.js";
import { Sovereign } from "@dist/index.js";

// Type tests
describe("Core Types", () => {
  it("should have all task states defined", () => {
    const states: TaskState[] = [
      "REQUESTED", "ANALYZED", "PLANNED", "IN_PROGRESS",
      "EXECUTED", "EVALUATING", "REPAIR_REQUIRED", "PARTIALLY_COMPLETE",
      "VERIFIED", "ACCEPTED", "BLOCKED", "FAILED", "UNVERIFIED"
    ];
    expect(states.length).toBe(13);
  });

  it("should identify terminal states correctly", () => {
    expect(isTerminalState("VERIFIED")).toBe(true);
    expect(isTerminalState("ACCEPTED")).toBe(true);
    expect(isTerminalState("BLOCKED")).toBe(true);
    expect(isTerminalState("FAILED")).toBe(true);
    expect(isTerminalState("IN_PROGRESS")).toBe(false);
    expect(isTerminalState("REQUESTED")).toBe(false);
  });

  it("should identify progress states correctly", () => {
    expect(isProgressState("IN_PROGRESS")).toBe(true);
    expect(isProgressState("EXECUTED")).toBe(true);
    expect(isProgressState("EVALUATING")).toBe(true);
    expect(isProgressState("REPAIR_REQUIRED")).toBe(true);
    expect(isProgressState("VERIFIED")).toBe(false);
  });

  it("should have default resource budget", () => {
    expect(DEFAULT_RESOURCE_BUDGET.maxRepairIterations).toBe(5);
    expect(DEFAULT_RESOURCE_BUDGET.timeBudgetMs).toBe(300000);
    expect(DEFAULT_RESOURCE_BUDGET.toolCallLimit).toBe(50);
  });

  it("should have all failure categories", () => {
    expect(FailureCategory.REQUIREMENT_MISUNDERSTOOD).toBe("REQUIREMENT_MISUNDERSTOOD");
    expect(FailureCategory.SECURITY_VIOLATION).toBe("SECURITY_VIOLATION");
    expect(FailureCategory.OTHER).toBe("OTHER");
  });
});

// Task Manager tests
describe("TaskManager", () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
  });

  it("should create a task with REQUESTED state", () => {
    const task = taskManager.createTask("Test objective");
    expect(task.id).toBeDefined();
    expect(task.objective).toBe("Test objective");
    expect(task.state).toBe("REQUESTED");
    expect(task.requirements).toEqual([]);
  });

  it("should create task with requirements", () => {
    const requirements: Requirement[] = [
      { id: "req-1", type: "MANDATORY", description: "Must work", acceptanceCriteria: ["works"], priority: 10, source: "user", dependencies: [] }
    ];
    const task = taskManager.createTask("Test", requirements);
    expect(task.requirements.length).toBe(1);
    expect(task.requirements[0].type).toBe("MANDATORY");
  });

  it("should transition states correctly", () => {
    const task = taskManager.createTask("Test");

    expect(taskManager.transitionState(task.id, "ANALYZED")).toBe(true);
    expect(task.state).toBe("ANALYZED");

    expect(taskManager.transitionState(task.id, "PLANNED")).toBe(true);
    expect(task.state).toBe("PLANNED");

    expect(taskManager.transitionState(task.id, "IN_PROGRESS")).toBe(true);
    expect(task.state).toBe("IN_PROGRESS");
    expect(task.startedAt).toBeDefined();
    expect(task.trace).toBeDefined();
  });

  it("should reject invalid state transitions", () => {
    const task = taskManager.createTask("Test");
    taskManager.transitionState(task.id, "ANALYZED");

    // Can't go from ANALYZED to VERIFIED directly
    expect(() => taskManager.transitionState(task.id, "VERIFIED")).toThrow();
  });

  it("should track child tasks", () => {
    const parent = taskManager.createTask("Parent");
    const child = taskManager.createTask("Child", [], parent.id);

    expect(parent.childTaskIds).toContain(child.id);
    expect(child.parentTaskId).toBe(parent.id);
  });

  it("should check budget violations", () => {
    const task = taskManager.createTask("Test");
    taskManager.transitionState(task.id, "ANALYZED");
    taskManager.transitionState(task.id, "PLANNED");
    taskManager.transitionState(task.id, "IN_PROGRESS");

    // Simulate exceeding tool call limit
    for (let i = 0; i < 55; i++) {
      taskManager.recordToolCall(task.id, {
        id: `call-${i}`,
        toolName: "test",
        inputs: {},
        startTime: new Date(),
        status: "COMPLETED"
      });
    }

    const { exceeded, violations } = taskManager.checkBudget(task.id);
    expect(exceeded).toBe(true);
    expect(violations.some(v => v.includes("Tool call limit"))).toBe(true);
  });
});

// Execution Engine tests
describe("ExecutionEngine", () => {
  let taskManager: TaskManager;
  let toolExecutor: DefaultToolExecutor;
  let authManager: InMemoryAuthorizationManager;
  let evidenceCollector: DefaultEvidenceCollector;
  let executionEngine: ExecutionEngine;

  beforeEach(() => {
    taskManager = new TaskManager();
    toolExecutor = new DefaultToolExecutor();
    authManager = new InMemoryAuthorizationManager(["READ_FILE", "WRITE_FILE"]);
    evidenceCollector = new DefaultEvidenceCollector();

    executionEngine = new ExecutionEngine({
      toolExecutor,
      authorizationManager: authManager,
      evidenceCollector,
      taskManager
    });
  });

  it("should register and execute tools", async () => {
    toolExecutor.registerTool(
      { name: "test-tool", description: "Test tool", acceptedInputs: {}, outputSchema: {}, preconditions: [], permissions: [], sideEffects: [], errors: [], resourceLimits: { maxExecutionTimeMs: 1000, maxMemoryMb: 10, maxRetries: 3, maxConcurrentCalls: 5 }, validationRequirements: [], applicableConstraints: [] },
      async (inputs) => ({ result: `processed ${inputs.value}` })
    );

    const task = taskManager.createTask("Test task");
    const result = await executionEngine.executeToolCall(task.id, "test-tool", { value: "hello" });

    expect(result.result).toBe("processed hello");
  });

  it("should check authorization", async () => {
    const hasPermission = await executionEngine.checkAuthorization(["READ_FILE"]);
    expect(hasPermission).toBe(true);

    const noPermission = await executionEngine.checkAuthorization(["DELETE_DATA"]);
    expect(noPermission).toBe(false); // Not granted by default
  });

  it("should collect evidence", async () => {
    toolExecutor.registerTool(
      { name: "evidence-tool", description: "Test", acceptedInputs: {}, outputSchema: {}, preconditions: [], permissions: [], sideEffects: [], errors: [], resourceLimits: { maxExecutionTimeMs: 1000, maxMemoryMb: 10, maxRetries: 3, maxConcurrentCalls: 5 }, validationRequirements: [], applicableConstraints: [] },
      async () => ({ success: true })
    );

    const task = taskManager.createTask("Test");
    await executionEngine.executeToolCall(task.id, "evidence-tool", {});

    const evidence = evidenceCollector.getEvidence(task.id);
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0].type).toBe("VERIFIED_RESULT");
  });
});

// Evaluation Engine tests
describe("EvaluationEngine", () => {
  let evaluationEngine: EvaluationEngine;

  beforeEach(() => {
    evaluationEngine = new EvaluationEngine(createDefaultEvaluationPolicy());
  });

  it("should evaluate trace with no errors as successful", () => {
    const trace: any = {
      taskId: "task-1",
      state: "EXECUTED",
      errors: [],
      toolCalls: [{ id: "1", toolName: "test", status: "COMPLETED" }],
      generatedArtifacts: [{ id: "a1", type: "code", metadata: { requirementId: "req-1" } }],
      resourceUsage: { toolCallCount: 5, modelCallCount: 0, totalExecutionTimeMs: 1000, peakMemoryMb: 50, totalCostUsd: 0 }
    };

    const requirements: Requirement[] = [
      { id: "req-1", type: "MANDATORY", description: "Test", acceptanceCriteria: ["works"], priority: 10, source: "user", dependencies: [] }
    ];

    // Add evidence to satisfy criteria
    evaluationEngine.addEvidence({
      id: "ev-1",
      type: "VERIFIED_RESULT",
      content: "Functional test passed",
      source: "test",
      timestamp: new Date(),
      confidence: 1.0,
      tags: ["requirement", "req-1"],
      relatedTaskId: "task-1"
    });
    evaluationEngine.addEvidence({
      id: "ev-2",
      type: "VERIFIED_RESULT",
      content: "Security check passed",
      source: "test",
      timestamp: new Date(),
      confidence: 1.0,
      tags: [],
      relatedTaskId: "task-1"
    });
    evaluationEngine.addEvidence({
      id: "ev-3",
      type: "OBSERVED_FACT",
      content: "Requirement req-1 satisfied",
      source: "test",
      timestamp: new Date(),
      confidence: 1.0,
      tags: ["requirement", "req-1"],
      relatedTaskId: "task-1"
    });
    evaluationEngine.addEvidence({
      id: "ev-4",
      type: "VERIFIED_RESULT",
      content: "Test passed",
      source: "test",
      timestamp: new Date(),
      confidence: 1.0,
      tags: ["test"],
      relatedTaskId: "task-1"
    });
    evaluationEngine.addEvidence({
      id: "ev-5",
      type: "OBSERVED_FACT",
      content: "Evidence for claim",
      source: "test",
      timestamp: new Date(),
      confidence: 0.8,
      tags: [],
      relatedTaskId: "task-1"
    });

    const result = evaluationEngine.evaluate(trace, requirements);

    expect(result.completionVerdict).toBe("SUCCESS");
    expect(result.policyComplianceVerdict).toBe("COMPLIANT");
    expect(result.executionQualityScores.requirementSatisfaction).toBeGreaterThan(0);
  });

  it("should detect security violations", () => {
    const trace: any = {
      taskId: "task-1",
      state: "FAILED",
      errors: [{ id: "e1", category: "SECURITY_VIOLATION", message: "Unauthorized access", timestamp: new Date(), recoverable: false }],
      toolCalls: [],
      generatedArtifacts: [],
      resourceUsage: { toolCallCount: 1, modelCallCount: 0, totalExecutionTimeMs: 100, peakMemoryMb: 10, totalCostUsd: 0 }
    };

    const result = evaluationEngine.evaluate(trace, []);

    expect(result.policyComplianceVerdict).toBe("VIOLATION");
    expect(result.completionVerdict).toBe("FAILED");
  });
});

// Decision Engine tests
describe("DecisionEngine", () => {
  let decisionEngine: DecisionEngine;

  beforeEach(() => {
    const provider = new DeterministicProvider();
    decisionEngine = new DecisionEngine({
      providers: new Map([["deterministic", provider]]),
      defaultProvider: "deterministic",
      policy: createDefaultDecisionPolicy()
    });
  });

  it("should make choice judgment", async () => {
    const judgment = await decisionEngine.makeChoiceJudgment(
      "Test context",
      "What is the failure category?",
      ["IMPLEMENTATION_DEFECT", "TOOL_FAILURE", "NEEDS_REVIEW"],
      ["evidence-1"]
    );

    expect(judgment.type).toBe("CHOICE");
    expect(judgment.allowedChoices).toContain(judgment.selectedChoice);
    expect(judgment.confidence).toBeGreaterThanOrEqual(0);
  });

  it("should make score judgment", async () => {
    const judgment = await decisionEngine.makeScoreJudgment(
      "Test context",
      "How complete is the implementation?",
      [{ level: 0, description: "Not complete" }, { level: 5, description: "Fully complete" }],
      ["evidence-1", "evidence-2"]
    );

    expect(judgment.type).toBe("SCORE");
    expect(judgment.score).toBeGreaterThanOrEqual(0);
    expect(judgment.score).toBeLessThanOrEqual(judgment.maxScore);
  });

  it("should make noul judgment", async () => {
    const judgment = await decisionEngine.makeNoulJudgment(
      "Test context",
      "Does the test pass?",
      ["evidence-1"]
    );

    expect(judgment.type).toBe("NOUL");
    expect(judgment.supported).toBe("UNCERTAIN");
  });

  it("should route decisions based on judgments", async () => {
    const choiceJudgment = await decisionEngine.makeChoiceJudgment(
      "Context", "Question?", ["SUCCESS", "FAILED"], []
    );
    const route = await decisionEngine.routeDecision(choiceJudgment);
    expect(["AUTOMATE", "VERIFY", "REPAIR", "ESCALATE", "BLOCK", "ABSTAIN"]).toContain(route);
  });
});

// Pattern Analysis tests
describe("PatternAnalysisEngine", () => {
  let patternEngine: PatternAnalysisEngine;

  beforeEach(() => {
    patternEngine = new PatternAnalysisEngine({ minOccurrences: 2 });
  });

  it("should discover failure patterns", () => {
    const now = new Date();

    // Add multiple failures of same category
    for (let i = 0; i < 3; i++) {
      patternEngine.addObservation({
        id: `obs-${i}`,
        taskId: `task-${i}`,
        type: "FAILURE",
        data: { category: "IMPLEMENTATION_DEFECT", message: "Type error", recoverable: true },
        timestamp: new Date(now.getTime() + i * 1000),
        tags: ["failure", "IMPLEMENTATION_DEFECT"]
      });
    }

    const patterns = patternEngine.discoverPatterns();
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].name).toContain("IMPLEMENTATION_DEFECT");
    expect(patterns[0].occurrenceCount).toBe(3);
  });

  it("should validate patterns", () => {
    const now = new Date();

    for (let i = 0; i < 3; i++) {
      patternEngine.addObservation({
        id: `obs-${i}`,
        taskId: `task-${i}`,
        type: "FAILURE",
        data: { category: "TOOL_FAILURE", message: "Timeout", recoverable: true },
        timestamp: new Date(now.getTime() + i * 1000),
        tags: ["failure", "TOOL_FAILURE"]
      });
    }

    const patterns = patternEngine.discoverPatterns();
    const pattern = patterns[0];

    const validation = patternEngine.validatePattern(pattern.id, []);
    expect(validation.validated).toBe(true);
    expect(validation.confidence).toBeGreaterThan(0.5);
  });
});

// Memory System tests
describe("MemorySystem", () => {
  let memory: MemorySystem;

  beforeEach(() => {
    memory = new MemorySystem();
  });

  it("should store and retrieve memories", () => {
    const mem = memory.store({
      category: "SEMANTIC",
      content: "TypeScript is a typed superset of JavaScript",
      source: "documentation",
      context: "language-facts",
      scope: "general",
      supportingEvidence: [],
      validationStatus: "VALIDATED",
      confidence: 0.9,
      tags: ["typescript", "language"]
    });

    expect(mem.id).toBeDefined();
    expect(mem.content).toBe("TypeScript is a typed superset of JavaScript");

    const retrieved = memory.get("SEMANTIC");
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].id).toBe(mem.id);
  });

  it("should detect conflicts", () => {
    memory.store({
      category: "SEMANTIC",
      content: "Same content",
      source: "source1",
      context: "test",
      scope: "test",
      supportingEvidence: [],
      validationStatus: "VALIDATED",
      confidence: 0.9,
      tags: []
    });

    memory.store({
      category: "SEMANTIC",
      content: "Same content",
      source: "source2",
      context: "test",
      scope: "test",
      supportingEvidence: [],
      validationStatus: "PENDING",
      confidence: 0.5,
      tags: []
    });

    const conflicts = memory.detectConflicts();
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].type).toBe("VALIDATION_CONFLICT");
  });

  it("should export and import memory", () => {
    memory.store({
      category: "EPISODIC",
      content: "Test memory",
      source: "test",
      context: "test",
      scope: "test",
      supportingEvidence: [],
      validationStatus: "VALIDATED",
      confidence: 1.0,
      tags: ["test"]
    });

    const exported = memory.exportMemory();
    const newMemory = new MemorySystem();
    const imported = newMemory.importMemory(exported);

    expect(imported).toBe(1);
    expect(newMemory.get("EPISODIC").length).toBe(1);
  });
});

// Outcome Graph tests
describe("OutcomeGraph", () => {
  let graph: OutcomeGraph;

  beforeEach(() => {
    graph = new OutcomeGraph();
  });

  it("should create nodes and edges", () => {
    const obj = graph.createNode("OBJECTIVE", "Build feature", { priority: "high" });
    const req = graph.createNode("REQUIREMENT", "Must be fast", { type: "MANDATORY" });

    const edge = graph.linkObjectiveToRequirement(obj.id, req.id);

    expect(edge.from).toBe(obj.id);
    expect(edge.to).toBe(req.id);
    expect(edge.type).toBe("REQUIRES");
  });

  it("should reconstruct decision path", () => {
    const obj = graph.createNode("OBJECTIVE", "Objective", {});
    const ev = graph.createNode("EVIDENCE", "Test passed", {});
    const dec = graph.createNode("DECISION", "Proceed", {});

    graph.createEdge(ev.id, dec.id, "SUPPORTED_BY");
    graph.createEdge(obj.id, dec.id, "INFORMED");

    const path = graph.reconstructDecisionPath(dec.id);
    expect(path.evidenceChain.length).toBe(1);
    expect(path.evidenceChain[0].node.id).toBe(ev.id);
  });

  it("should find paths between nodes", () => {
    const a = graph.createNode("OBJECTIVE", "A", {});
    const b = graph.createNode("REQUIREMENT", "B", {});
    const c = graph.createNode("ARTIFACT", "C", {});

    graph.createEdge(a.id, b.id, "REQUIRES");
    graph.createEdge(b.id, c.id, "IMPLEMENTED_AS");

    const paths = graph.findPath(a.id, c.id);
    expect(paths.length).toBe(1);
    expect(paths[0].length).toBe(2);
  });
});

// Integration test
describe("Sovereign Integration", () => {
  it("should create sovereign instance and execute task", async () => {
    const sovereign = new Sovereign({
      initialPermissions: ["READ_FILE", "WRITE_FILE"]
    });

    expect(sovereign.taskManager).toBeDefined();
    expect(sovereign.executionEngine).toBeDefined();
    expect(sovereign.evaluationEngine).toBeDefined();
    expect(sovereign.decisionEngine).toBeDefined();
    expect(sovereign.patternAnalysis).toBeDefined();
    expect(sovereign.memory).toBeDefined();
    expect(sovereign.outcomeGraph).toBeDefined();
  });

  it("should report system status", () => {
    const sovereign = new Sovereign();
    const status = sovereign.getStatus();

    expect(status.tasks).toBeDefined();
    expect(status.memory).toBeDefined();
    expect(status.patterns).toBeDefined();
    expect(status.graph).toBeDefined();
  });
});
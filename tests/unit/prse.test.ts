/**
 * PRSE Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  PRSEEngine,
  PRSEConfig,
  DEFAULT_PRSE_CONFIG,
  PRSEPhase,
  PRSEContext,
  PRSEIteration,
  AcceptanceCriterion,
  CriterionEvaluation,
  IdentifiedIssue,
  Correction,
  IterationOutcome,
  Constraint,
  Assumption,
  EvaluationDimension,
  calculateExcellence,
  PRSE_PHASES,
  EVALUATION_DIMENSIONS
} from "../../src/prse/index.js";

describe("PRSE Types", () => {
  it("should have all PRSE phases defined", () => {
    expect(PRSE_PHASES).toContain("UNDERSTAND");
    expect(PRSE_PHASES).toContain("DECONSTRUCT");
    expect(PRSE_PHASES).toContain("DISCOVER");
    expect(PRSE_PHASES).toContain("ARCHITECT");
    expect(PRSE_PHASES).toContain("BUILD");
    expect(PRSE_PHASES).toContain("EVALUATE");
    expect(PRSE_PHASES).toContain("DIAGNOSE");
    expect(PRSE_PHASES).toContain("IMPROVE");
    expect(PRSE_PHASES).toContain("REPEAT");
    expect(PRSE_PHASES).toContain("VALIDATE");
    expect(PRSE_PHASES).toContain("RELEASE");
    expect(PRSE_PHASES).toContain("EVOLVE");
    expect(PRSE_PHASES.length).toBe(12);
  });

  it("should have all evaluation dimensions defined", () => {
    expect(EVALUATION_DIMENSIONS).toContain("CORRECTNESS");
    expect(EVALUATION_DIMENSIONS).toContain("COMPLETENESS");
    expect(EVALUATION_DIMENSIONS).toContain("SECURITY");
    expect(EVALUATION_DIMENSIONS).toContain("MAINTAINABILITY");
    expect(EVALUATION_DIMENSIONS.length).toBe(18);
  });

  it("should have default PRSE config", () => {
    expect(DEFAULT_PRSE_CONFIG.maxIterations).toBe(10);
    expect(DEFAULT_PRSE_CONFIG.timeBudgetMs).toBe(600000);
    expect(DEFAULT_PRSE_CONFIG.minimumMandatoryScore).toBe(0.8);
    expect(DEFAULT_PRSE_CONFIG.minimumOverallScore).toBe(0.7);
    expect(DEFAULT_PRSE_CONFIG.requireAllMandatory).toBe(true);
    expect(DEFAULT_PRSE_CONFIG.enablePatternAnalysis).toBe(true);
    expect(DEFAULT_PRSE_CONFIG.stoppingConditions.length).toBe(4);
  });

  it("should calculate excellence metrics", () => {
    const metrics = {
      verifiedValue: 0.9,
      reliability: 0.85,
      adaptability: 0.8,
      totalCost: 0.3,
      residualRisk: 0.2
    };
    const result = calculateExcellence(metrics);
    expect(result.excellenceScore).toBeGreaterThan(0);
    expect(result.verifiedValue).toBe(0.9);
    expect(result.reliability).toBe(0.85);
  });

  it("should calculate excellence with zero denominator", () => {
    const metrics = {
      verifiedValue: 0.5,
      reliability: 0.5,
      adaptability: 0.5,
      totalCost: 0,
      residualRisk: 0
    };
    const result = calculateExcellence(metrics);
    expect(result.excellenceScore).toBe(0);
  });
});

describe("PRSEEngine", () => {
  let engine: PRSEEngine;

  beforeEach(() => {
    engine = new PRSEEngine();
  });

  it("should create engine with default config", () => {
    expect(engine).toBeDefined();
    expect(engine.getCurrentContext()).toBeNull();
  });

  it("should start a session", async () => {
    const context = await engine.startSession({
      objective: "Test objective",
      beneficiaries: ["user"],
      desiredOutcome: "Test passes",
      scope: "unit test",
      constraints: [],
      assumptions: [],
      availableResources: {
        maxRepairIterations: 5,
        timeBudgetMs: 300000,
        costBudgetUsd: 10,
        toolCallLimit: 50,
        modelCallLimit: 20,
        memoryLimitMb: 512,
        escalationTriggers: []
      }
    });

    expect(context.objective).toBe("Test objective");
    expect(context.currentPhase).toBe("UNDERSTAND");
    expect(context.iterationHistory).toEqual([]);
  });

  it("should execute UNDERSTAND phase", async () => {
    await engine.startSession({
      objective: "Test objective",
      beneficiaries: ["user"],
      desiredOutcome: "Test passes",
      scope: "unit test",
      constraints: [],
      assumptions: [],
      availableResources: {
        maxRepairIterations: 5,
        timeBudgetMs: 300000,
        costBudgetUsd: 10,
        toolCallLimit: 50,
        modelCallLimit: 20,
        memoryLimitMb: 512,
        escalationTriggers: []
      }
    });

    const output = await engine.executePhase("UNDERSTAND");

    expect(output.phase).toBe("UNDERSTAND");
    expect(output.artifacts).toBeDefined();
    expect(output.decisions).toBeDefined();
    expect(output.evidence).toBeDefined();
    expect(output.riskAssessment).toBeDefined();
  });

  it("should execute all phases in sequence", async () => {
    await engine.startSession({
      objective: "Test objective",
      beneficiaries: ["user"],
      desiredOutcome: "Test passes",
      scope: "unit test",
      constraints: [],
      assumptions: [],
      availableResources: {
        maxRepairIterations: 5,
        timeBudgetMs: 300000,
        costBudgetUsd: 10,
        toolCallLimit: 50,
        modelCallLimit: 20,
        memoryLimitMb: 512,
        escalationTriggers: []
      }
    });

    for (const phase of PRSE_PHASES) {
      const output = await engine.executePhase(phase);
      expect(output.phase).toBe(phase);
    }

    const history = engine.getIterationHistory();
    expect(history.length).toBe(PRSE_PHASES.length);
  });

  it("should check stopping conditions", async () => {
    await engine.startSession({
      objective: "Test objective",
      beneficiaries: ["user"],
      desiredOutcome: "Test passes",
      scope: "unit test",
      constraints: [],
      assumptions: [],
      availableResources: {
        maxRepairIterations: 5,
        timeBudgetMs: 100,
        costBudgetUsd: 10,
        toolCallLimit: 50,
        modelCallLimit: 20,
        memoryLimitMb: 512,
        escalationTriggers: []
      }
    });

    await engine.executePhase("UNDERSTAND");
    await engine.executePhase("DECONSTRUCT");

    const stopCheck = engine.checkStoppingConditions();
    expect(stopCheck.shouldStop).toBeDefined();
  });

  it("should generate iteration summary", async () => {
    await engine.startSession({
      objective: "Test objective",
      beneficiaries: ["user"],
      desiredOutcome: "Test passes",
      scope: "unit test",
      constraints: [],
      assumptions: [],
      availableResources: {
        maxRepairIterations: 5,
        timeBudgetMs: 300000,
        costBudgetUsd: 10,
        toolCallLimit: 50,
        modelCallLimit: 20,
        memoryLimitMb: 512,
        escalationTriggers: []
      }
    });

    await engine.executePhase("UNDERSTAND");

    const summary = engine.getIterationSummary();
    expect(summary).toBeDefined();
    expect(summary?.iterationId).toBeDefined();
    expect(summary?.outcome).toBeDefined();
    expect(["PROGRESS", "KNOWLEDGE", "CORRECTION", "BLOCKED", "EXHAUSTED", "COMPLETED"]).toContain(summary?.outcome);
  });

  it("should generate session report", async () => {
    await engine.startSession({
      objective: "Test objective",
      beneficiaries: ["user"],
      desiredOutcome: "Test passes",
      scope: "unit test",
      constraints: [],
      assumptions: [],
      availableResources: {
        maxRepairIterations: 5,
        timeBudgetMs: 300000,
        costBudgetUsd: 10,
        toolCallLimit: 50,
        modelCallLimit: 20,
        memoryLimitMb: 512,
        escalationTriggers: []
      }
    });

    await engine.executePhase("UNDERSTAND");
    await engine.executePhase("DECONSTRUCT");

    const report = engine.generateReport();
    expect(report).toContain("PRSE Session Report");
    expect(report).toContain("Test objective");
    expect(report).toContain("Total Iterations:");
  });

  it("should analyze patterns", async () => {
    await engine.startSession({
      objective: "Test objective",
      beneficiaries: ["user"],
      desiredOutcome: "Test passes",
      scope: "unit test",
      constraints: [],
      assumptions: [],
      availableResources: {
        maxRepairIterations: 5,
        timeBudgetMs: 300000,
        costBudgetUsd: 10,
        toolCallLimit: 50,
        modelCallLimit: 20,
        memoryLimitMb: 512,
        escalationTriggers: []
      }
    });

    await engine.executePhase("UNDERSTAND");
    await engine.executePhase("DECONSTRUCT");

    const patterns = engine.analyzePatterns();
    expect(Array.isArray(patterns)).toBe(true);
  });
});

describe("PRSE Acceptance Criteria", () => {
  let engine: PRSEEngine;

  beforeEach(() => {
    engine = new PRSEEngine();
  });

  it("should have criteria for UNDERSTAND phase", async () => {
    await engine.startSession({
      objective: "Test objective",
      beneficiaries: ["user"],
      desiredOutcome: "Test passes",
      scope: "unit test",
      constraints: [],
      assumptions: [],
      availableResources: {
        maxRepairIterations: 5,
        timeBudgetMs: 300000,
        costBudgetUsd: 10,
        toolCallLimit: 50,
        modelCallLimit: 20,
        memoryLimitMb: 512,
        escalationTriggers: []
      }
    });

    await engine.executePhase("UNDERSTAND");

    const context = engine.getCurrentContext();
    expect(context).toBeDefined();
    expect(context?.iterationHistory.length).toBeGreaterThan(0);

    const lastIteration = context!.iterationHistory[context!.iterationHistory.length - 1];
    expect(lastIteration.evaluations.length).toBeGreaterThan(0);
  });

  it("should evaluate objective clarity criterion", async () => {
    await engine.startSession({
      objective: "",
      beneficiaries: ["user"],
      desiredOutcome: "Test passes",
      scope: "unit test",
      constraints: [],
      assumptions: [],
      availableResources: {
        maxRepairIterations: 5,
        timeBudgetMs: 300000,
        costBudgetUsd: 10,
        toolCallLimit: 50,
        modelCallLimit: 20,
        memoryLimitMb: 512,
        escalationTriggers: []
      }
    });

    await engine.executePhase("UNDERSTAND");

    const context = engine.getCurrentContext();
    const lastIteration = context!.iterationHistory[context!.iterationHistory.length - 1];
    const clarityEval = lastIteration.evaluations.find(e => e.reasoning.includes("Objective"));

    expect(clarityEval).toBeDefined();
    expect(clarityEval?.satisfied).toBe(false);
  });

  it("should evaluate constraints identified criterion", async () => {
    await engine.startSession({
      objective: "Test objective",
      beneficiaries: ["user"],
      desiredOutcome: "Test passes",
      scope: "unit test",
      constraints: [],
      assumptions: [],
      availableResources: {
        maxRepairIterations: 5,
        timeBudgetMs: 300000,
        costBudgetUsd: 10,
        toolCallLimit: 50,
        modelCallLimit: 20,
        memoryLimitMb: 512,
        escalationTriggers: []
      }
    });

    await engine.executePhase("UNDERSTAND");

    const context = engine.getCurrentContext();
    const lastIteration = context!.iterationHistory[context!.iterationHistory.length - 1];
    const constraintEval = lastIteration.evaluations.find(e => e.reasoning.includes("constraint"));

    expect(constraintEval).toBeDefined();
    expect(constraintEval?.satisfied).toBe(false);
  });
});

describe("PRSE Integration with Sovereign", () => {
  it("should export PRSE from main index", async () => {
    const { PRSEEngine, DEFAULT_PRSE_CONFIG, PRSE_PHASES, EVALUATION_DIMENSIONS, calculateExcellence } = await import("../../src/index.js");

    expect(PRSEEngine).toBeDefined();
    expect(DEFAULT_PRSE_CONFIG).toBeDefined();
    expect(PRSE_PHASES).toBeDefined();
    expect(EVALUATION_DIMENSIONS).toBeDefined();
    expect(calculateExcellence).toBeDefined();
  });
});
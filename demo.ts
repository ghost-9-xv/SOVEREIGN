/**
 * SOVEREIGN Demo
 * Demonstrates core capabilities of the framework
 */

import {
  Sovereign,
  Requirement,
  RequirementType,
  TaskState,
  Evidence,
  EvidenceType,
  FailureCategory
} from "./src/index";

async function runDemo() {
  console.log("=== SOVEREIGN Framework Demo ===\n");

  // Initialize SOVEREIGN with basic permissions
  const sovereign = new Sovereign({
    initialPermissions: ["READ_FILE", "WRITE_FILE", "EXECUTE_COMMAND"],
    resourceBudget: {
      maxRepairIterations: 3,
      timeBudgetMs: 60000,
      toolCallLimit: 20
    }
  });

  // Register a simple tool for demonstration
  const toolExecutor = (sovereign as any).executionEngine.options.toolExecutor;
  toolExecutor.registerTool(
    {
      name: "create_file",
      description: "Create a file with given content",
      acceptedInputs: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } },
      outputSchema: { type: "object", properties: { success: { type: "boolean" } } },
      preconditions: ["Path must be valid"],
      permissions: ["WRITE_FILE"],
      sideEffects: ["Creates file on filesystem"],
      errors: [{ code: "PERMISSION_DENIED", message: "Write permission required", recoverable: false }],
      resourceLimits: { maxExecutionTimeMs: 5000, maxMemoryMb: 10, maxRetries: 2, maxConcurrentCalls: 3 },
      validationRequirements: ["Path validation"],
      applicableConstraints: []
    },
    async (inputs: { path: string; content: string }) => {
      // In real implementation, this would write to filesystem
      console.log(`  [TOOL] create_file: ${inputs.path} (${inputs.content.length} chars)`);
      return { success: true };
    }
  );

  toolExecutor.registerTool(
    {
      name: "run_tests",
      description: "Run test suite",
      acceptedInputs: { type: "object", properties: { testPath: { type: "string" } } },
      outputSchema: { type: "object", properties: { passed: { type: "number" }, failed: { type: "number" } } },
      preconditions: ["Test files exist"],
      permissions: ["EXECUTE_COMMAND"],
      sideEffects: ["Runs test process"],
      errors: [{ code: "TEST_FAILURE", message: "Tests failed", recoverable: true }],
      resourceLimits: { maxExecutionTimeMs: 30000, maxMemoryMb: 100, maxRetries: 1, maxConcurrentCalls: 1 },
      validationRequirements: [],
      applicableConstraints: []
    },
    async (inputs: { testPath: string }) => {
      console.log(`  [TOOL] run_tests: ${inputs.testPath}`);
      // Simulate test results
      return { passed: 5, failed: 0 };
    }
  );

  // Define requirements for a task
  const requirements: Requirement[] = [
    {
      id: "req-1",
      type: "MANDATORY" as RequirementType,
      description: "Create a TypeScript utility module",
      acceptanceCriteria: [
        "Module exports validateString function",
        "Function returns boolean",
        "Handles null/undefined input"
      ],
      priority: 10,
      source: "user",
      dependencies: []
    },
    {
      id: "req-2",
      type: "MANDATORY" as RequirementType,
      description: "Write unit tests for the utility",
      acceptanceCriteria: [
        "Tests cover valid strings",
        "Tests cover invalid inputs",
        "Tests cover edge cases"
      ],
      priority: 9,
      source: "user",
      dependencies: ["req-1"]
    },
    {
      id: "req-3",
      type: "OPTIONAL" as RequirementType,
      description: "Add JSDoc documentation",
      acceptanceCriteria: ["All exports documented"],
      priority: 5,
      source: "preference",
      dependencies: ["req-1"]
    }
  ];

  console.log("1. Creating task with requirements...");
  const task = sovereign.taskManager.createTask(
    "Build a string validation utility with tests",
    requirements
  );
  console.log(`   Task ID: ${task.id}`);
  console.log(`   State: ${task.state}`);
  console.log(`   Requirements: ${task.requirements.length}`);

  // Show task state transitions
  console.log("\n2. Demonstrating task state transitions...");
  const states: TaskState[] = ["ANALYZED", "PLANNED", "IN_PROGRESS"];
  for (const state of states) {
    sovereign.taskManager.transitionState(task.id, state);
    console.log(`   ${task.id}: ${task.state}`);
  }

  // Execute task (simulated)
  console.log("\n3. Executing task (simulated)...");
  const trace = await sovereign.executionEngine.executeTask(task);
  console.log(`   Final state: ${trace.state}`);
  console.log(`   Tool calls: ${trace.toolCalls.length}`);
  console.log(`   Errors: ${trace.errors.length}`);

  // Add some evidence for evaluation
  console.log("\n4. Collecting evidence...");
  const evidence: Evidence[] = [
    {
      id: "ev-1",
      type: "VERIFIED_RESULT" as EvidenceType,
      content: "validateString function created and exported",
      source: "execution-engine",
      timestamp: new Date(),
      confidence: 0.95,
      tags: ["requirement", "req-1"],
      relatedTaskId: task.id
    },
    {
      id: "ev-2",
      type: "VERIFIED_RESULT" as EvidenceType,
      content: "Unit tests created and passing (5 passed, 0 failed)",
      source: "test-runner",
      timestamp: new Date(),
      confidence: 1.0,
      tags: ["requirement", "req-2", "test"],
      relatedTaskId: task.id
    },
    {
      id: "ev-3",
      type: "OBSERVED_FACT" as EvidenceType,
      content: "JSDoc comments added to all exports",
      source: "code-review",
      timestamp: new Date(),
      confidence: 0.8,
      tags: ["requirement", "req-3"],
      relatedTaskId: task.id
    }
  ];

  for (const ev of evidence) {
    sovereign.evaluationEngine.addEvidence(ev);
    console.log(`   Added: ${ev.content}`);
  }

  // Evaluate the task
  console.log("\n5. Evaluating against criteria...");
  const evaluation = sovereign.evaluationEngine.evaluate(trace, requirements);
  console.log(`   Completion Verdict: ${evaluation.completionVerdict}`);
  console.log(`   Policy Compliance: ${evaluation.policyComplianceVerdict}`);
  console.log(`   Quality Scores:`);
  for (const [key, value] of Object.entries(evaluation.executionQualityScores)) {
    console.log(`     ${key}: ${(value * 100).toFixed(0)}%`);
  }
  console.log(`   Verified Criteria: ${evaluation.verifiedCriteria.length}`);
  console.log(`   Failed Criteria: ${evaluation.failedCriteria.length}`);

  // Demonstrate decision engine
  console.log("\n6. Making structured judgments (JEV-inspired)...");

  // CHOICE judgment
  const choice = await sovereign.decisionEngine.makeChoiceJudgment(
    "Task completion evaluation",
    "What is the overall task outcome?",
    ["SUCCESS", "PARTIAL", "FAILED", "NEEDS_REVIEW"],
    ["ev-1", "ev-2", "ev-3"]
  );
  console.log(`   CHOICE: ${choice.selectedChoice} (confidence: ${choice.confidence})`);

  // SCORE judgment
  const score = await sovereign.decisionEngine.makeScoreJudgment(
    "Code quality assessment",
    "How maintainable is the implementation?",
    [
      { level: 0, description: "Unmaintainable" },
      { level: 1, description: "Very difficult" },
      { level: 2, description: "Difficult" },
      { level: 3, description: "Moderate" },
      { level: 4, description: "Good" },
      { level: 5, description: "Excellent" }
    ],
    ["ev-1", "ev-3"]
  );
  console.log(`   SCORE: ${score.score}/${score.maxScore} (confidence: ${score.confidence})`);

  // NOUL judgment
  const noul = await sovereign.decisionEngine.makeNoulJudgment(
    "Security review",
    "Does the implementation have any security vulnerabilities?",
    ["ev-1", "ev-2"]
  );
  console.log(`   NOUL: ${noul.supported} (confidence: ${noul.confidence})`);

  // Route decision based on judgment
  const route = await sovereign.decisionEngine.routeDecision(choice);
  console.log(`   Decision Route: ${route}`);

  // Demonstrate pattern analysis
  console.log("\n7. Pattern analysis...");
  // Create some simulated observations
  for (let i = 0; i < 4; i++) {
    sovereign.patternAnalysis.addObservation({
      id: `obs-${i}`,
      taskId: `task-${i}`,
      type: "FAILURE",
      data: { category: "IMPLEMENTATION_DEFECT", message: "Type error in validation", recoverable: true },
      timestamp: new Date(Date.now() - i * 86400000),
      tags: ["failure", "IMPLEMENTATION_DEFECT"]
    });
  }

  const patterns = sovereign.patternAnalysis.discoverPatterns();
  console.log(`   Discovered ${patterns.length} patterns`);
  for (const pattern of patterns) {
    console.log(`   - ${pattern.name}: ${pattern.occurrenceCount} occurrences, confidence: ${pattern.confidence}`);
  }

  // Demonstrate memory system
  console.log("\n8. Memory system...");
  const mem = sovereign.memory.store({
    category: "PROCEDURAL",
    content: "String validation utility pattern: create function, write tests, add docs",
    source: "demo-task",
    context: "string-utilities",
    scope: "general",
    supportingEvidence: evidence,
    validationStatus: "VALIDATED",
    confidence: 0.9,
    tags: ["pattern", "string-validation", "workflow"]
  });
  console.log(`   Stored memory: ${mem.id}`);

  const retrieved = sovereign.memory.get("PROCEDURAL", { tags: ["string-validation"] });
  console.log(`   Retrieved ${retrieved.length} related memories`);

  // Demonstrate outcome graph
  console.log("\n9. Outcome graph (decision traceability)...");
  const objNode = sovereign.outcomeGraph.createNode("OBJECTIVE", "Build string validation utility", { taskId: task.id });
  const req1Node = sovereign.outcomeGraph.createNode("REQUIREMENT", "Create validateString function", { id: "req-1" });
  const req2Node = sovereign.outcomeGraph.createNode("REQUIREMENT", "Write unit tests", { id: "req-2" });
  const artifactNode = sovereign.outcomeGraph.createNode("ARTIFACT", "string-validator.ts", { path: "src/string-validator.ts" });
  const testNode = sovereign.outcomeGraph.createNode("TEST", "string-validator.test.ts", { path: "tests/string-validator.test.ts" });
  const judgmentNode = sovereign.outcomeGraph.createNode("JUDGMENT", "Task evaluation", { verdict: evaluation.completionVerdict });
  const outcomeNode = sovereign.outcomeGraph.createNode("OUTCOME", "Task completed successfully", { taskId: task.id });

  sovereign.outcomeGraph.linkObjectiveToRequirement(objNode.id, req1Node.id);
  sovereign.outcomeGraph.linkObjectiveToRequirement(objNode.id, req2Node.id);
  sovereign.outcomeGraph.linkRequirementToArtifact(req1Node.id, artifactNode.id);
  sovereign.outcomeGraph.linkRequirementToArtifact(req2Node.id, testNode.id);
  sovereign.outcomeGraph.linkArtifactToTest(artifactNode.id, testNode.id);
  sovereign.outcomeGraph.linkTestToJudgment(testNode.id, judgmentNode.id);
  sovereign.outcomeGraph.linkJudgmentToOutcome(judgmentNode.id, outcomeNode.id);

  console.log(`   Graph nodes: ${sovereign.outcomeGraph.getAllNodes().length}`);
  console.log(`   Graph edges: ${sovereign.outcomeGraph.getAllEdges().length}`);

  // Reconstruct decision path
  const path = sovereign.outcomeGraph.reconstructDecisionPath(judgmentNode.id);
  console.log(`   Evidence chain length: ${path.evidenceChain.length}`);

  // Show system status
  console.log("\n10. System status...");
  const status = sovereign.getStatus();
  console.log(`   Tasks: ${status.tasks.total} (${Object.entries(status.tasks.byState).map(([k,v]) => `${k}:${v}`).join(", ")})`);
  console.log(`   Memory: ${status.memory.totalMemories} total`);
  console.log(`   Patterns: ${status.patterns}`);
  console.log(`   Graph: ${status.graph.nodeCount} nodes, ${status.graph.edgeCount} edges`);

  console.log("\n=== Demo Complete ===");
  console.log("\nSOVEREIGN demonstrated:");
  console.log("  ✓ Task lifecycle management with explicit states");
  console.log("  ✓ Tool execution with contracts and permissions");
  console.log("  ✓ Evidence collection during execution");
  console.log("  ✓ Recursive evaluation against acceptance criteria");
  console.log("  ✓ JEV-inspired structured judgments (CHOICE, SCORE, NOUL)");
  console.log("  ✓ Decision routing based on judgments");
  console.log("  ✓ Pattern detection from observations");
  console.log("  ✓ Persistent memory with provenance");
  console.log("  ✓ Outcome graph for decision traceability");
}

// Run demo
runDemo().catch(console.error);

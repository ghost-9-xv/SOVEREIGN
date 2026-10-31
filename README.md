# SOVEREIGN

SOVEREIGN is a TypeScript framework for building AI agent systems that can reason, evaluate, repair, and learn from execution traces. The repository contains the core execution model, structured judgment logic, pattern analysis, memory, outcome tracking, and a PRSE (Principled Recursive Systems Engineering) workflow engine.

This project is a framework prototype and reference implementation rather than a packaged SaaS product. The code is organized as a library that can be embedded in a host application or used as a building block for experimentation.

## Repository status

- Default branch: `MAIN`
- Primary language: TypeScript
- License: Apache 2.0
- Current architecture: framework core + PRSE workflow engine + tests

## What is implemented

The repository currently includes:

- Task lifecycle and budget management
- Execution engine with tool contracts and permission checks
- Evaluation engine for requirement and criterion scoring
- Structured decision engine with CHOICE, SCORE, and NOUL judgments
- Pattern analysis over execution observations
- Memory system with validation and conflict detection
- Outcome graph for traceability and decision replay
- PRSE phases for iterative engineering workflows

## Repository layout

```text
SOVEREIGN/
├── README.md
├── demo.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── LICENSE
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── task-manager.ts
│   ├── execution-engine.ts
│   ├── evaluation-engine.ts
│   ├── decision-engine.ts
│   ├── pattern-analysis.ts
│   ├── memory.ts
│   ├── outcome-graph.ts
│   └── prse/
│       ├── engine.ts
│       ├── index.ts
│       └── types.ts
├── tests/
│   └── unit/
│       ├── core.test.ts
│       └── prse.test.ts
└── .jules/
    └── sentinel.md
```

## Core components

### TaskManager
Manages task creation, state transitions, resource budgets, tool calls, and trace collection.

### ExecutionEngine
Runs tasks, enforces tool permissions, records evidence, and tracks execution traces.

### EvaluationEngine
Scores task execution against criteria and returns verdicts such as `SUCCESS`, `PARTIAL`, `FAILED`, and `UNVERIFIED`.

### DecisionEngine
Creates structured judgments using deterministic providers and routing logic for automated or manual follow-up.

### PatternAnalysisEngine
Finds recurring failure, evaluation, and resource patterns from recorded observations.

### MemorySystem
Stores short- and long-term memories by category, with validation and conflict detection.

### OutcomeGraph
Links objectives, requirements, artifacts, evidence, and decisions to support traceability.

### PRSEEngine
Provides a recursive engineering workflow across phases such as `UNDERSTAND`, `DECONSTRUCT`, `ARCHITECT`, `BUILD`, `EVALUATE`, `DIAGNOSE`, `IMPROVE`, `REPEAT`, `VALIDATE`, `RELEASE`, and `EVOLVE`.

## Installation

From the repository root:

```bash
cd SOVEREIGN
npm install
npm run build
npm test
```

If you only want to type-check without building:

```bash
npm run typecheck
```

## Quick start

The simplest entry point is the `Sovereign` class exported from `src/index.ts`.

```ts
import { Sovereign } from "./src/index.js";

const sovereign = new Sovereign({
  initialPermissions: ["READ_FILE", "WRITE_FILE"],
  resourceBudget: {
    maxRepairIterations: 3,
    timeBudgetMs: 60000,
    toolCallLimit: 20
  }
});

const task = sovereign.taskManager.createTask("Build a utility module", [
  {
    id: "req-1",
    type: "MANDATORY",
    description: "Create a utility function",
    acceptanceCriteria: ["Function is exported", "Input validation is explicit"],
    priority: 10,
    source: "user",
    dependencies: []
  }
]);

const status = sovereign.getStatus();
console.log(status.tasks.total);
```

### Registering a tool

```ts
const tool = {
  name: "read_file",
  description: "Read a file from disk",
  acceptedInputs: {
    type: "object",
    properties: {
      path: { type: "string" }
    },
    required: ["path"]
  },
  outputSchema: {
    type: "object",
    properties: {
      content: { type: "string" }
    }
  },
  permissions: ["READ_FILE"],
  sideEffects: ["Reads data from disk"],
  errors: [],
  resourceLimits: {
    maxExecutionTimeMs: 10000,
    maxMemoryMb: 64,
    maxRetries: 1,
    maxConcurrentCalls: 1
  },
  validationRequirements: ["Verify path exists"],
  applicableConstraints: []
};

sovereign.registerTool("read_file", tool, async ({ path }) => ({
  content: `Contents of ${path}`
}));
```

## Example script

The repository includes a demo script at `demo.ts` that illustrates the major framework capabilities:

- task creation and state transitions
- tool registration and execution
- evidence collection
- evaluation and verdict generation
- structured judgment calls
- pattern discovery
- memory storage
- outcome graph construction

Run it with:

```bash
npx tsx demo.ts
```

## Development notes

### Testing

```bash
npm test
```

The test suite covers the core framework and the PRSE workflow modules.

### TypeScript build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Architecture principles

The implementation follows a few explicit design ideas:

- Outcome over output: completion is decided by evidence and acceptance criteria.
- Evidence before confidence: conclusions are tied to traceable observations.
- Explicit uncertainty: unsupported assertions should be marked as uncertain instead of inferred.
- Bounded autonomy: permissions, tool contracts, and execution budgets are explicit.
- Traceability: decisions, requirements, artifacts, and evidence are linked in the outcome graph.

## Known limitations

This repository is best understood as a conceptual framework and engineering substrate rather than a finished production system. Some components intentionally use deterministic or simplified logic as placeholders for extension by a host application or model-backed provider.

Examples of current design assumptions:

- Decision providers are intentionally lightweight and deterministic by default.
- Authorization is in-memory by default and is intended for local experimentation.
- Tool execution contracts are explicit but the framework does not provide a server, scheduler, or cloud runtime by itself.
- The project is designed to be composed with external tooling and model infrastructure.

## License

This project is licensed under the Apache License 2.0.

See `LICENSE` for full license text.

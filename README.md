# SOVEREIGN

**AI Agent Augmentation Framework** - An intelligent execution layer, recursive evaluation engine, and adaptive engineering system.

## Overview

SOVEREIGN is an open-source framework that makes existing AI agents more capable by providing:

- **Adaptive Polymathic Intelligence** - Dynamically selects relevant expertise for each subtask
- **Recursive Evaluation & Repair** - Evaluates outputs against explicit criteria, diagnoses failures, implements targeted fixes
- **Pattern Analysis** - Detects meaningful patterns across execution traces and engineering failures
- **JEV-Inspired Decision Engine** - Structured semantic judgments (CHOICE, SCORE, NOUL)
- **Persistent Memory & Outcome Graph** - Evidence-linked representation of decisions and outcomes
- **Controlled Self-Improvement** - Evidence-based workflow evolution with rollback capability
- **Professional Software Engineering** - Built with security, testing, and maintainability as first-class concerns

## Architecture

```
sovereign/
├── src/
│   ├── types.ts              # Core type definitions
│   ├── task-manager.ts       # Task lifecycle management
│   ├── execution-engine.ts   # Tool execution with contracts & permissions
│   ├── evaluation-engine.ts  # Recursive evaluation against criteria
│   ├── decision-engine.ts    # JEV-inspired structured judgments
│   ├── pattern-analysis.ts   # Pattern detection & trend analysis
│   ├── memory.ts             # Persistent memory with provenance
│   ├── outcome-graph.ts      # Decision traceability graph
│   └── index.ts              # Main entry point
├── tests/
│   └── unit/
│       └── core.test.ts      # Unit tests
├── package.json
└── tsconfig.json
```

## Core Components

### Task Manager
Manages task lifecycle with explicit states:
- REQUESTED → ANALYZED → PLANNED → IN_PROGRESS → EXECUTED → EVALUATING → VERIFIED/REPAIR_REQUIRED

### Execution Engine
- Tool contracts with input/output schemas
- Permission-based authorization
- Evidence collection during execution
- Resource budget enforcement

### Evaluation Engine
- Independent evaluation against explicit criteria
- Completion verdicts: SUCCESS, PARTIAL, FAILED, UNVERIFIED
- Policy compliance: COMPLIANT, VIOLATION, UNVERIFIED
- Execution quality scoring across 10 dimensions

### Decision Engine (JEV-Inspired)
Three judgment types:
- **CHOICE** - Categorical selection from explicit options
- **SCORE** - Rubric-based evaluation (0-5 scale)
- **NOUL** - Bounded truth judgment (supported/uncertain/unsupported)

### Pattern Analysis
- Deterministic feature extraction
- Candidate pattern discovery
- Evidence evaluation with counterevidence
- Longitudinal trend analysis

### Memory System
9 memory categories with provenance tracking:
- SEMANTIC, EPISODIC, PROCEDURAL, DECISION, EXPERIMENTAL, PREFERENCE, PROJECT, EXPERTISE, PATTERN

### Outcome Graph
Evidence-linked relationships for decision replay and traceability.

## Installation

```bash
cd sovereign
npm install
npm run build
npm test
```

## Quick Start

```typescript
import { Sovereign, Requirement, RequirementType } from "sovereign";

const sovereign = new Sovereign({
  initialPermissions: ["READ_FILE", "WRITE_FILE"]
});

const requirements: Requirement[] = [
  {
    id: "req-1",
    type: "MANDATORY",
    description: "Create a TypeScript function",
    acceptanceCriteria: ["Compiles without errors", "Passes tests"],
    priority: 10,
    source: "user",
    dependencies: []
  }
];

const { task, trace, evaluation } = await sovereign.executeTask(
  "Create a utility function for string validation",
  requirements
);

console.log("Verdict:", evaluation.completionVerdict);
console.log("Quality:", evaluation.executionQualityScores);
```

## Milestones

- ✅ **Milestone 1**: Discovery & Baseline - Core types, task management, execution engine
- 🔄 **Milestone 2**: Verified Execution Core - Tool contracts, permission checks, evidence collection
- 🔄 **Milestone 3**: Recursive Evaluation - Independent evaluation, failure classification, targeted repair
- 🔄 **Milestone 4**: Adaptive Polymath - Expertise selection, principle research, evidence tracking
- 🔄 **Milestone 5**: JEV Decision Engine - CHOICE/SCORE/NOUL judgments, provider adapters
- 🔄 **Milestone 6**: Pattern Analysis - Observation records, pattern discovery, validation
- 🔄 **Milestone 7**: Pattern-Driven Repair - Root cause hypotheses, corrective changes
- 🔄 **Milestone 8**: Memory & Outcome Graph - Persistent memory, decision replay
- 🔄 **Milestone 9**: Controlled Self-Improvement - Baseline comparisons, adoption controls
- 🔄 **Milestone 10**: Interoperability - Stable interfaces, documentation, examples

## Principles

- **Outcome over output** - Tasks complete only when acceptance criteria are verified
- **Evidence before confidence** - Ground conclusions in observable evidence
- **Simplicity before ambition** - Minimal architecture that satisfies requirements
- **Explicit uncertainty** - Return INSUFFICIENT_EVIDENCE when appropriate
- **Bounded autonomy** - Explicit permissions, resource budgets, stopping conditions
- **Honest reporting** - Never fabricate results or claim unverified completion

## Testing

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

## License

MIT

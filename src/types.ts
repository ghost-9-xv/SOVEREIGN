/**
 * SOVEREIGN Core Types
 * Fundamental type definitions for the SOVEREIGN framework
 */

// ============================================================
// Task States (Part 2.1)
// ============================================================

export type TaskState =
  | "REQUESTED"
  | "ANALYZED"
  | "PLANNED"
  | "IN_PROGRESS"
  | "EXECUTED"
  | "EVALUATING"
  | "REPAIR_REQUIRED"
  | "PARTIALLY_COMPLETE"
  | "VERIFIED"
  | "ACCEPTED"
  | "BLOCKED"
  | "FAILED"
  | "UNVERIFIED";

export function isTerminalState(state: TaskState): boolean {
  return ["VERIFIED", "ACCEPTED", "BLOCKED", "FAILED"].includes(state);
}

export function isProgressState(state: TaskState): boolean {
  return ["IN_PROGRESS", "EXECUTED", "EVALUATING", "REPAIR_REQUIRED"].includes(state);
}

// ============================================================
// Requirements Classification (Part 2.2)
// ============================================================

export type RequirementType =
  | "MANDATORY"
  | "OPTIONAL"
  | "PREFERENCE"
  | "TECHNICAL_CONSTRAINT"
  | "SECURITY"
  | "ASSUMPTION"
  | "UNCERTAINTY"
  | "UNSUPPORTED_EXPECTATION";

export interface Requirement {
  id: string;
  type: RequirementType;
  description: string;
  acceptanceCriteria: string[];
  priority: number; // 1-10, higher = more important
  source: string; // Where this requirement came from
  dependencies: string[]; // Other requirement IDs this depends on
}

// ============================================================
// Evidence Types (Part 2.3)
// ============================================================

export type EvidenceType =
  | "OBSERVED_FACT"
  | "VERIFIED_RESULT"
  | "EXTERNAL_CLAIM"
  | "MODEL_JUDGMENT"
  | "HYPOTHESIS"
  | "ASSUMPTION"
  | "PREDICTION"
  | "UNKNOWN";

export interface Evidence {
  id: string;
  type: EvidenceType;
  content: string;
  source: string;
  timestamp: Date;
  confidence: number; // 0-1
  tags: string[];
  relatedTaskId?: string;
}

// ============================================================
// Uncertainty Responses (Part 2.5)
// ============================================================

export type UncertaintyResponse =
  | "SUFFICIENT_EVIDENCE"
  | "INSUFFICIENT_EVIDENCE"
  | "CONFLICTING_EVIDENCE"
  | "NEEDS_INVESTIGATION"
  | "NEEDS_HUMAN_REVIEW"
  | "OUTSIDE_VALIDATED_SCOPE";

// ============================================================
// Expertise & Disciplines (Part 3)
// ============================================================

export interface Discipline {
  name: string;
  description: string;
  applicablePrinciples: string[];
  verificationMethods: string[];
  knownFailureModes: string[];
}

export interface ExpertiseSpecification {
  subtask: string;
  disciplines: Discipline[];
  applicablePrinciples: string[];
  supportingEvidence: Evidence[];
  constraints: string[];
  expectedFailures: string[];
  decisions: Decision[];
  acceptanceCriteria: string[];
  verificationMethod: string;
  stoppingCondition: string;
}

export interface Decision {
  id: string;
  description: string;
  justification: string;
  alternatives: string[];
  evidence: Evidence[];
  timestamp: Date;
}

// ============================================================
// Tool Contracts (Part 5.2)
// ============================================================

export interface ToolContract {
  name: string;
  description: string;
  acceptedInputs: Record<string, unknown>; // JSON Schema
  outputSchema: Record<string, unknown>; // JSON Schema
  preconditions: string[];
  permissions: string[];
  sideEffects: string[];
  errors: ToolError[];
  resourceLimits: ResourceLimits;
  validationRequirements: string[];
  applicableConstraints: string[];
}

export interface ToolError {
  code: string;
  message: string;
  recoverable: boolean;
}

export interface ResourceLimits {
  maxExecutionTimeMs: number;
  maxMemoryMb: number;
  maxRetries: number;
  maxConcurrentCalls: number;
}

// ============================================================
// Execution State (Part 9.1)
// ============================================================

export interface ExecutionTrace {
  taskId: string;
  startTime: Date;
  endTime?: Date;
  state: TaskState;
  toolCalls: ToolCall[];
  generatedArtifacts: Artifact[];
  errors: ExecutionError[];
  resourceUsage: ResourceUsage;
}

export interface ToolCall {
  id: string;
  toolName: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  startTime: Date;
  endTime?: Date;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "TIMEOUT";
  error?: string;
}

export interface Artifact {
  id: string;
  type: string;
  path: string;
  contentHash: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface ExecutionError {
  id: string;
  toolCallId?: string;
  category: FailureCategory;
  message: string;
  stackTrace?: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface ResourceUsage {
  toolCallCount: number;
  modelCallCount: number;
  totalExecutionTimeMs: number;
  peakMemoryMb: number;
  totalCostUsd: number;
}

// ============================================================
// Failure Classification (Part 6.1 A. CHOICE)
// ============================================================

export type FailureCategory =
  | "REQUIREMENT_MISUNDERSTOOD"
  | "INSUFFICIENT_RESEARCH"
  | "WRONG_EXPERTISE_SELECTED"
  | "PLANNING_FAILURE"
  | "IMPLEMENTATION_DEFECT"
  | "TOOL_FAILURE"
  | "INTEGRATION_FAILURE"
  | "VERIFICATION_GAP"
  | "SECURITY_VIOLATION"
  | "RESOURCE_EXHAUSTION"
  | "INSUFFICIENT_EVIDENCE"
  | "OTHER";

export const FailureCategory = {
  REQUIREMENT_MISUNDERSTOOD: "REQUIREMENT_MISUNDERSTOOD" as FailureCategory,
  INSUFFICIENT_RESEARCH: "INSUFFICIENT_RESEARCH" as FailureCategory,
  WRONG_EXPERTISE_SELECTED: "WRONG_EXPERTISE_SELECTED" as FailureCategory,
  PLANNING_FAILURE: "PLANNING_FAILURE" as FailureCategory,
  IMPLEMENTATION_DEFECT: "IMPLEMENTATION_DEFECT" as FailureCategory,
  TOOL_FAILURE: "TOOL_FAILURE" as FailureCategory,
  INTEGRATION_FAILURE: "INTEGRATION_FAILURE" as FailureCategory,
  VERIFICATION_GAP: "VERIFICATION_GAP" as FailureCategory,
  SECURITY_VIOLATION: "SECURITY_VIOLATION" as FailureCategory,
  RESOURCE_EXHAUSTION: "RESOURCE_EXHAUSTION" as FailureCategory,
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE" as FailureCategory,
  OTHER: "OTHER" as FailureCategory
};

export const FAILURE_CATEGORIES: FailureCategory[] = [
  "REQUIREMENT_MISUNDERSTOOD",
  "INSUFFICIENT_RESEARCH",
  "WRONG_EXPERTISE_SELECTED",
  "PLANNING_FAILURE",
  "IMPLEMENTATION_DEFECT",
  "TOOL_FAILURE",
  "INTEGRATION_FAILURE",
  "VERIFICATION_GAP",
  "SECURITY_VIOLATION",
  "RESOURCE_EXHAUSTION",
  "INSUFFICIENT_EVIDENCE",
  "OTHER"
];

// ============================================================
// JEV-Inspired Decision Types (Part 6.1)
// ============================================================

export type JudgmentType = "CHOICE" | "SCORE" | "NOUL";

export interface ChoiceJudgment {
  type: "CHOICE";
  question: string;
  allowedChoices: string[];
  selectedChoice: string;
  confidence: number;
  reasoning: string;
}

export interface ScoreJudgment {
  type: "SCORE";
  question: string;
  rubric: RubricLevel[];
  score: number;
  maxScore: number;
  reasoning: string;
}

export interface RubricLevel {
  level: number;
  description: string;
}

export interface NoulJudgment {
  type: "NOUL";
  proposition: string;
  supported: boolean | "UNCERTAIN";
  confidence: number;
  evidence: string[];
  reasoning: string;
}

export type StructuredJudgment = ChoiceJudgment | ScoreJudgment | NoulJudgment;

// ============================================================
// Decision Contract (Part 6.2)
// ============================================================

export interface DecisionContract {
  context: string;
  question: string;
  questionType: JudgmentType;
  allowedOutputs: Record<string, unknown>;
  rubric?: RubricLevel[];
  evidenceReferences: string[];
  modelResult: StructuredJudgment;
  provider: string;
  modelVersion: string;
  calibrationStatus: "CALIBRATED" | "UNCALIBRATED" | "UNKNOWN";
  policy: DecisionPolicy;
  finalDecision: string;
  verification: Evidence[];
  outcome?: string;
}

export interface DecisionPolicy {
  thresholds: Record<string, number>;
  escalationRules: EscalationRule[];
  automationRules: AutomationRule[];
}

export interface EscalationRule {
  condition: string;
  action: "ESCALATE" | "BLOCK" | "REQUIRE_HUMAN_REVIEW";
}

export interface AutomationRule {
  condition: string;
  action: "AUTOMATE" | "VERIFY" | "REPAIR";
}

// ============================================================
// Evaluation Types (Part 8)
// ============================================================

export type CompletionVerdict = "SUCCESS" | "PARTIAL" | "FAILED" | "UNVERIFIED";
export type PolicyComplianceVerdict = "COMPLIANT" | "VIOLATION" | "UNVERIFIED";

export interface EvaluationResult {
  taskId: string;
  completionVerdict: CompletionVerdict;
  policyComplianceVerdict: PolicyComplianceVerdict;
  executionQualityScores: ExecutionQualityScores;
  missingEvidence: string[];
  contradictoryEvidence: string[];
  verifiedCriteria: string[];
  failedCriteria: string[];
  timestamp: Date;
}

export interface ExecutionQualityScores {
  requirementSatisfaction: number;
  correctness: number;
  completeness: number;
  evidenceQuality: number;
  efficiency: number;
  robustness: number;
  security: number;
  maintainability: number;
  errorHandling: number;
  verificationQuality: number;
  accessibility?: number;
}

// ============================================================
// Pattern Analysis Types (Part 7)
// ============================================================

export type PatternCategory =
  | "PERFORMANCE"
  | "USABILITY"
  | "ENGINEERING"
  | "SECURITY"
  | "WORKFLOW"
  | "BEHAVIORAL"
  | "RESEARCH"
  | "OTHER";

export type PatternStatus =
  | "HYPOTHESIS"
  | "UNDER_INVESTIGATION"
  | "VALIDATED"
  | "REJECTED"
  | "OBSOLETE";

export interface PatternRecord {
  id: string;
  name: string;
  category: PatternCategory;
  observations: string[]; // Observation IDs
  firstObserved: Date;
  lastObserved: Date;
  occurrenceCount: number;
  measurementWindow: { start: Date; end: Date };
  affectedComponents: string[];
  supportingEvidence: Evidence[];
  contradictoryEvidence: Evidence[];
  candidateExplanations: string[];
  severity: number; // 1-5
  relevance: number; // 1-5
  confidence: number; // 0-1
  status: PatternStatus;
  nextAction: string;
  verificationMethod: string;
  outcome?: string;
}

// ============================================================
// Memory Types (Part 15)
// ============================================================

export type MemoryCategory =
  | "SEMANTIC"
  | "EPISODIC"
  | "PROCEDURAL"
  | "DECISION"
  | "EXPERIMENTAL"
  | "PREFERENCE"
  | "PROJECT"
  | "EXPERTISE"
  | "PATTERN";

export interface MemoryRecord {
  id: string;
  category: MemoryCategory;
  content: string;
  source: string;
  timestamp: Date;
  context: string;
  scope: string;
  supportingEvidence: Evidence[];
  validationStatus: "VALIDATED" | "PENDING" | "REJECTED" | "STALE";
  confidence: number;
  revalidationConditions: string[];
  tags: string[];
}

// ============================================================
// Outcome Graph Types (Part 16)
// ============================================================

export type NodeType =
  | "OBJECTIVE"
  | "REQUIREMENT"
  | "ASSUMPTION"
  | "RESEARCH"
  | "EVIDENCE"
  | "ARTIFACT"
  | "TEST"
  | "JUDGMENT"
  | "OUTCOME"
  | "DECISION"
  | "PATTERN"
  | "FAILURE"
  | "ROOT_CAUSE"
  | "CORRECTIVE_ACTION";

export type RelationshipType =
  | "REQUIRES"
  | "DEPENDS_ON"
  | "INVESTIGATED_BY"
  | "INFORMED_BY"
  | "IMPLEMENTED_AS"
  | "VERIFIED_BY"
  | "EVALUATED_BY"
  | "PRODUCED"
  | "INFORMED"
  | "CONTRIBUTED_TO"
  | "EVALUATED_BY"
  | "SUPPORTED_BY"
  | "CHALLENGED_BY"
  | "CLASSIFIED_AS"
  | "INFORMED"
  | "TESTED_BY"
  | "COMPARED_AGAINST";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: RelationshipType;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================
// Evolution Engine Types (Part 17)
// ============================================================

export interface ImprovementProposal {
  id: string;
  observedWeakness: string;
  supportingEvidence: Evidence[];
  rootCauseHypothesis: string;
  proposedChange: string;
  expectedBenefit: string;
  possibleSideEffects: string[];
  baseline: string;
  evaluationDataset: string;
  acceptanceCriteria: string[];
  regressionChecks: string[];
  status: "PROPOSED" | "TESTING" | "ADOPTED" | "REJECTED" | "ROLLED_BACK";
  createdAt: Date;
  adoptedAt?: Date;
  rolledBackAt?: Date;
}

// ============================================================
// Security & Permissions (Part 13)
// ============================================================

export type Permission =
  | "READ_FILE"
  | "WRITE_FILE"
  | "EXECUTE_COMMAND"
  | "NETWORK_REQUEST"
  | "SEND_COMMUNICATION"
  | "PUBLISH_CONTENT"
  | "SPEND_MONEY"
  | "DELETE_DATA"
  | "DEPLOY_CHANGES"
  | "MODIFY_INFRASTRUCTURE"
  | "ACCESS_RESTRICTED_INFO"
  | "IRREVERSIBLE_ACTION";

export interface AuthorizationRequest {
  id: string;
  operation: string;
  requiredPermissions: Permission[];
  justification: string;
  requestedBy: string;
  timestamp: Date;
  status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED";
  approvedBy?: string;
  approvedAt?: Date;
}

// ============================================================
// Resource Budget (Part 9.6)
// ============================================================

export interface ResourceBudget {
  maxRepairIterations: number;
  timeBudgetMs: number;
  costBudgetUsd: number;
  toolCallLimit: number;
  modelCallLimit: number;
  memoryLimitMb: number;
  escalationTriggers: EscalationTrigger[];
}

export interface EscalationTrigger {
  metric: string;
  threshold: number;
  action: "PAUSE" | "ESCALATE" | "TERMINATE";
}

export const DEFAULT_RESOURCE_BUDGET: ResourceBudget = {
  maxRepairIterations: 5,
  timeBudgetMs: 300000, // 5 minutes
  costBudgetUsd: 10.0,
  toolCallLimit: 50,
  modelCallLimit: 20,
  memoryLimitMb: 512,
  escalationTriggers: [
    { metric: "repairIterations", threshold: 3, action: "ESCALATE" },
    { metric: "executionTimeMs", threshold: 240000, action: "PAUSE" },
    { metric: "toolCallCount", threshold: 40, action: "PAUSE" },
    { metric: "errorRate", threshold: 0.5, action: "ESCALATE" }
  ]
};

/**
 * SOVEREIGN Core Types
 * Fundamental type definitions for the SOVEREIGN framework
 */
export function isTerminalState(state) {
    return ["VERIFIED", "ACCEPTED", "BLOCKED", "FAILED"].includes(state);
}
export function isProgressState(state) {
    return ["IN_PROGRESS", "EXECUTED", "EVALUATING", "REPAIR_REQUIRED"].includes(state);
}
export const FailureCategory = {
    REQUIREMENT_MISUNDERSTOOD: "REQUIREMENT_MISUNDERSTOOD",
    INSUFFICIENT_RESEARCH: "INSUFFICIENT_RESEARCH",
    WRONG_EXPERTISE_SELECTED: "WRONG_EXPERTISE_SELECTED",
    PLANNING_FAILURE: "PLANNING_FAILURE",
    IMPLEMENTATION_DEFECT: "IMPLEMENTATION_DEFECT",
    TOOL_FAILURE: "TOOL_FAILURE",
    INTEGRATION_FAILURE: "INTEGRATION_FAILURE",
    VERIFICATION_GAP: "VERIFICATION_GAP",
    SECURITY_VIOLATION: "SECURITY_VIOLATION",
    RESOURCE_EXHAUSTION: "RESOURCE_EXHAUSTION",
    INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
    OTHER: "OTHER"
};
export const FAILURE_CATEGORIES = [
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
export const DEFAULT_RESOURCE_BUDGET = {
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
//# sourceMappingURL=types.js.map
/**
 * PRSE - Principle of Recursive Systems Engineering
 * Type definitions for the PRSE capability
 */
export const PRSE_PHASES = [
    "UNDERSTAND",
    "DECONSTRUCT",
    "DISCOVER",
    "ARCHITECT",
    "BUILD",
    "EVALUATE",
    "DIAGNOSE",
    "IMPROVE",
    "REPEAT",
    "VALIDATE",
    "RELEASE",
    "EVOLVE"
];
export const DEFAULT_PRSE_CONFIG = {
    maxIterations: 10,
    timeBudgetMs: 600000, // 10 minutes
    computeBudgetUnits: 1000,
    minimumMandatoryScore: 0.8,
    minimumOverallScore: 0.7,
    requireAllMandatory: true,
    enablePatternAnalysis: true,
    enableAdversarialTesting: false,
    stoppingConditions: [
        { id: "all-mandatory", type: "ALL_MANDATORY_PASS", description: "All mandatory criteria satisfied" },
        { id: "budget-time", type: "BUDGET_EXHAUSTED", threshold: 600000, description: "Time budget exhausted" },
        { id: "max-iterations", type: "MAX_ITERATIONS", threshold: 10, description: "Maximum iterations reached" },
        { id: "no-progress", type: "NO_PROGRESS", threshold: 3, description: "No meaningful progress in 3 iterations" }
    ]
};
export function calculateExcellence(metrics) {
    const { verifiedValue, reliability, adaptability, totalCost, residualRisk } = metrics;
    const numerator = verifiedValue * reliability * adaptability;
    const denominator = totalCost + residualRisk;
    const excellenceScore = denominator > 0 ? numerator / denominator : 0;
    return { ...metrics, excellenceScore };
}
export const EVALUATION_DIMENSIONS = [
    "CORRECTNESS",
    "COMPLETENESS",
    "RELIABILITY",
    "ROBUSTNESS",
    "EFFICIENCY",
    "RESOURCE_CONSUMPTION",
    "SECURITY",
    "PRIVACY",
    "USABILITY",
    "ACCESSIBILITY",
    "MAINTAINABILITY",
    "EXTENSIBILITY",
    "ETHICAL_COMPLIANCE",
    "LEGAL_COMPLIANCE",
    "SUSTAINABILITY",
    "EDGE_CASE_HANDLING",
    "FAILURE_RECOVERY",
    "USER_EXPERIENCE"
];
//# sourceMappingURL=types.js.map
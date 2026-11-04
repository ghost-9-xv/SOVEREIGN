/**
 * SOVEREIGN Evaluation Engine
 * Implements recursive evaluation against explicit criteria (Part 8, 9)
 */
import { EvaluationResult, Evidence, Requirement, ExecutionTrace } from "./types.js";
export interface EvaluationCriterion {
    id: string;
    name: string;
    description: string;
    requirementIds: string[];
    weight: number;
    mandatory: boolean;
    evaluate: (trace: ExecutionTrace, evidence: Evidence[]) => CriterionResult;
}
export interface CriterionResult {
    satisfied: boolean;
    score: number;
    evidence: Evidence[];
    reasoning: string;
}
export interface EvaluationPolicy {
    criteria: EvaluationCriterion[];
    minimumMandatoryScore: number;
    minimumOverallScore: number;
    requireAllMandatory: boolean;
}
export declare class EvaluationEngine {
    private policy;
    private evidence;
    constructor(policy: EvaluationPolicy);
    addEvidence(evidence: Evidence): void;
    getEvidence(): Evidence[];
    evaluate(trace: ExecutionTrace, requirements: Requirement[]): EvaluationResult;
    private calculateQualityScores;
    private scoreCorrectness;
    private scoreCompleteness;
    private scoreEvidenceQuality;
    private scoreEfficiency;
    private scoreRobustness;
    private scoreSecurity;
    private scoreErrorHandling;
    private scoreVerificationQuality;
    private determineCompletionVerdict;
    private determinePolicyCompliance;
}
export declare function createDefaultEvaluationPolicy(): EvaluationPolicy;
//# sourceMappingURL=evaluation-engine.d.ts.map
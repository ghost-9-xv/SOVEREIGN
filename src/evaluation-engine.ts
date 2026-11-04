/**
 * SOVEREIGN Evaluation Engine
 * Implements recursive evaluation against explicit criteria (Part 8, 9)
 */

import {
  EvaluationResult,
  CompletionVerdict,
  PolicyComplianceVerdict,
  ExecutionQualityScores,
  Evidence,
  Requirement,
  ExecutionTrace
} from "./types.js";

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

export class EvaluationEngine {
  private policy: EvaluationPolicy;
  private evidence: Evidence[] = [];

  constructor(policy: EvaluationPolicy) {
    this.policy = policy;
  }

  addEvidence(evidence: Evidence): void {
    this.evidence.push(evidence);
  }

  getEvidence(): Evidence[] {
    return [...this.evidence];
  }

  evaluate(trace: ExecutionTrace, requirements: Requirement[]): EvaluationResult {
    const criterionResults = new Map<string, CriterionResult>();
    const verifiedCriteria: string[] = [];
    const failedCriteria: string[] = [];
    const missingEvidence: string[] = [];
    const contradictoryEvidence: string[] = [];

    for (const criterion of this.policy.criteria) {
      const result = criterion.evaluate(trace, this.evidence);
      criterionResults.set(criterion.id, result);

      if (result.satisfied) {
        verifiedCriteria.push(criterion.id);
      } else {
        failedCriteria.push(criterion.id);

        if (criterion.mandatory) {
          missingEvidence.push(`Mandatory criterion not satisfied: ${criterion.name}`);
        }
      }

      const supporting = result.evidence.filter(e => e.type === "VERIFIED_RESULT" || e.type === "OBSERVED_FACT");
      const contradicting = result.evidence.filter(e => e.type === "EXTERNAL_CLAIM" && e.confidence < 0.5);

      if (supporting.length > 0 && contradicting.length > 0) {
        contradictoryEvidence.push(`Conflicting evidence for ${criterion.name}`);
      }
    }

    const executionQualityScores = this.calculateQualityScores(trace, criterionResults, requirements);

    const completionVerdict = this.determineCompletionVerdict(
      criterionResults,
      trace,
      requirements
    );

    const policyComplianceVerdict = this.determinePolicyCompliance(
      criterionResults,
      trace
    );

    return {
      taskId: trace.taskId,
      completionVerdict,
      policyComplianceVerdict,
      executionQualityScores,
      missingEvidence,
      contradictoryEvidence,
      verifiedCriteria,
      failedCriteria,
      timestamp: new Date()
    };
  }

  private calculateQualityScores(
    trace: ExecutionTrace,
    criterionResults: Map<string, CriterionResult>,
    _requirements: Requirement[]
  ): ExecutionQualityScores {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [id, result] of criterionResults) {
      const criterion = this.policy.criteria.find(c => c.id === id);
      if (criterion) {
        totalWeight += criterion.weight;
        weightedSum += result.score * criterion.weight;
      }
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      requirementSatisfaction: overallScore,
      correctness: this.scoreCorrectness(trace),
      completeness: this.scoreCompleteness(trace),
      evidenceQuality: this.scoreEvidenceQuality(),
      efficiency: this.scoreEfficiency(trace),
      robustness: this.scoreRobustness(trace),
      security: this.scoreSecurity(trace),
      maintainability: 0.8,
      errorHandling: this.scoreErrorHandling(trace),
      verificationQuality: this.scoreVerificationQuality(criterionResults),
      accessibility: 0.8
    };
  }

  private scoreCorrectness(trace: ExecutionTrace): number {
    if (trace.errors.length === 0) return 1.0;
    const recoverableErrors = trace.errors.filter(e => e.recoverable).length;
    return Math.max(0, 1.0 - (trace.errors.length - recoverableErrors) * 0.2);
  }

  private scoreCompleteness(trace: ExecutionTrace): number {
    if (trace.generatedArtifacts.length === 0) return 0.5;
    return Math.min(1.0, trace.generatedArtifacts.length * 0.2);
  }

  private scoreEvidenceQuality(): number {
    if (this.evidence.length === 0) return 0;
    const verifiedCount = this.evidence.filter(e =>
      e.type === "VERIFIED_RESULT" || e.type === "OBSERVED_FACT"
    ).length;
    return verifiedCount / this.evidence.length;
  }

  private scoreEfficiency(trace: ExecutionTrace): number {
    const toolCallPenalty = Math.min(trace.resourceUsage.toolCallCount * 0.05, 0.5);
    const timePenalty = Math.min(trace.resourceUsage.totalExecutionTimeMs / 60000 * 0.1, 0.3);
    return Math.max(0.1, 1.0 - toolCallPenalty - timePenalty);
  }

  private scoreRobustness(trace: ExecutionTrace): number {
    const errorRate = trace.toolCalls.length > 0
      ? trace.errors.length / trace.toolCalls.length
      : 0;
    return Math.max(0, 1.0 - errorRate * 2);
  }

  private scoreSecurity(trace: ExecutionTrace): number {
    const securityErrors = trace.errors.filter(e => e.category === "SECURITY_VIOLATION").length;
    return securityErrors === 0 ? 1.0 : Math.max(0, 1.0 - securityErrors * 0.5);
  }

  private scoreErrorHandling(trace: ExecutionTrace): number {
    const handledErrors = trace.errors.filter(e => e.recoverable).length;
    const totalErrors = trace.errors.length;
    if (totalErrors === 0) return 1.0;
    return handledErrors / totalErrors;
  }

  private scoreVerificationQuality(criterionResults: Map<string, CriterionResult>): number {
    if (criterionResults.size === 0) return 0;
    let verifiedCount = 0;
    for (const result of criterionResults.values()) {
      if (result.evidence.some(e => e.type === "VERIFIED_RESULT")) {
        verifiedCount++;
      }
    }
    return verifiedCount / criterionResults.size;
  }

  private determineCompletionVerdict(
    criterionResults: Map<string, CriterionResult>,
    trace: ExecutionTrace,
    _requirements: Requirement[]
  ): CompletionVerdict {
    const mandatoryCriteria = this.policy.criteria.filter(c => c.mandatory);
    const mandatoryResults = mandatoryCriteria.map(c => criterionResults.get(c.id)!).filter(Boolean);

    const allMandatorySatisfied = mandatoryResults.every(r => r && r.satisfied);
    const anyMandatoryFailed = mandatoryResults.some(r => r && !r.satisfied);

    if (trace.state === "FAILED") return "FAILED";

    if (allMandatorySatisfied && mandatoryResults.length > 0) {
      const optionalCriteria = this.policy.criteria.filter(c => !c.mandatory);
      const optionalResults = optionalCriteria.map(c => criterionResults.get(c.id)!).filter(Boolean);
      const allOptionalSatisfied = optionalResults.every(r => r && r.satisfied);

      return allOptionalSatisfied ? "SUCCESS" : "PARTIAL";
    }

    if (anyMandatoryFailed) return "FAILED";

    return "UNVERIFIED";
  }

  private determinePolicyCompliance(
    criterionResults: Map<string, CriterionResult>,
    trace: ExecutionTrace
  ): PolicyComplianceVerdict {
    const securityViolations = trace.errors.filter(e => e.category === "SECURITY_VIOLATION");
    if (securityViolations.length > 0) return "VIOLATION";

    const mandatoryCriteria = this.policy.criteria.filter(c => c.mandatory);
    const mandatoryResults = mandatoryCriteria.map(c => criterionResults.get(c.id)!).filter(Boolean);
    const allMandatorySatisfied = mandatoryResults.every(r => r && r.satisfied);

    if (!allMandatorySatisfied) return "VIOLATION";

    return "COMPLIANT";
  }
}

export function createDefaultEvaluationPolicy(): EvaluationPolicy {
  return {
    criteria: [
      {
        id: "functional-correctness",
        name: "Functional Correctness",
        description: "The implementation produces correct outputs for given inputs",
        requirementIds: [],
        weight: 0.3,
        mandatory: true,
        evaluate: (trace, evidence) => {
          const hasErrors = trace.errors.length > 0;
          const verifiedResults = evidence.filter(e => e.type === "VERIFIED_RESULT");
          return {
            satisfied: !hasErrors && verifiedResults.length > 0,
            score: hasErrors ? 0 : Math.min(1, verifiedResults.length * 0.2),
            evidence: verifiedResults,
            reasoning: hasErrors ? "Execution has errors" : `${verifiedResults.length} verified results`
          };
        }
      },
      {
        id: "requirement-coverage",
        name: "Requirement Coverage",
        description: "All mandatory requirements are addressed",
        requirementIds: [],
        weight: 0.25,
        mandatory: true,
        evaluate: (_trace, evidence) => {
          const requirementEvidence = evidence.filter(e => e.tags.includes("requirement"));
          return {
            satisfied: requirementEvidence.length > 0,
            score: Math.min(1, requirementEvidence.length * 0.25),
            evidence: requirementEvidence,
            reasoning: `${requirementEvidence.length} requirements with evidence`
          };
        }
      },
      {
        id: "test-coverage",
        name: "Test Coverage",
        description: "Tests exist and pass for the implementation",
        requirementIds: [],
        weight: 0.2,
        mandatory: false,
        evaluate: (_trace, evidence) => {
          const testEvidence = evidence.filter(e => e.tags.includes("test"));
          const passedTests = testEvidence.filter(e => e.content.includes("passed")).length;
          const totalTests = testEvidence.length;
          return {
            satisfied: totalTests > 0 && passedTests === totalTests,
            score: totalTests > 0 ? passedTests / totalTests : 0,
            evidence: testEvidence,
            reasoning: `${passedTests}/${totalTests} tests passed`
          };
        }
      },
      {
        id: "security-compliance",
        name: "Security Compliance",
        description: "No security violations detected",
        requirementIds: [],
        weight: 0.15,
        mandatory: true,
        evaluate: (trace) => {
          const securityViolations = trace.errors.filter(e => e.category === "SECURITY_VIOLATION");
          return {
            satisfied: securityViolations.length === 0,
            score: securityViolations.length === 0 ? 1.0 : 0,
            evidence: [],
            reasoning: securityViolations.length > 0
              ? `${securityViolations.length} security violations`
              : "No security violations"
          };
        }
      },
      {
        id: "resource-efficiency",
        name: "Resource Efficiency",
        description: "Execution stays within resource budgets",
        requirementIds: [],
        weight: 0.1,
        mandatory: false,
        evaluate: (trace) => {
          const budgetExceeded = trace.resourceUsage.toolCallCount > 50 ||
                                 trace.resourceUsage.totalExecutionTimeMs > 300000;
          return {
            satisfied: !budgetExceeded,
            score: budgetExceeded ? 0.5 : 1.0,
            evidence: [],
            reasoning: budgetExceeded ? "Resource budget exceeded" : "Within resource limits"
          };
        }
      }
    ],
    minimumMandatoryScore: 0.8,
    minimumOverallScore: 0.7,
    requireAllMandatory: true
  };
}

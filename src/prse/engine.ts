/**
 * PRSE Engine
 * Implements the Principle of Recursive Systems Engineering workflow
 */

import {
  PRSEPhase,
  PRSEConfig,
  DEFAULT_PRSE_CONFIG,
  PRSEContext,
  AcceptanceCriterion,
  CriterionEvaluation,
  PhaseOutput,
  IterationOutcome
} from "./types.js";

import { PatternAnalysisEngine } from "../pattern-analysis.js";
import { MemorySystem } from "../memory.js";
import { OutcomeGraph } from "../outcome-graph.js";

export interface PRSEEngineOptions {
  config?: Partial<PRSEConfig>;
  patternAnalysis?: PatternAnalysisEngine;
  memory?: MemorySystem;
  outcomeGraph?: OutcomeGraph;
}

export class PRSEEngine {
  private config: PRSEConfig;
  private patternAnalysis: PatternAnalysisEngine;
  private memory: MemorySystem;
  private outcomeGraph: OutcomeGraph;
  private currentContext: PRSEContext | null = null;
  private iterationCounter = 0;
  private phaseCriteria: Map<PRSEPhase, AcceptanceCriterion[]> = new Map();

  constructor(options: PRSEEngineOptions = {}) {
    this.config = { ...DEFAULT_PRSE_CONFIG, ...options.config };
    this.patternAnalysis = options.patternAnalysis || new PatternAnalysisEngine();
    this.memory = options.memory || new MemorySystem();
    this.outcomeGraph = options.outcomeGraph || new OutcomeGraph();
    this.initializePhaseCriteria();
  }

  private initializePhaseCriteria(): void {
    this.phaseCriteria.set("UNDERSTAND", [
      {
        id: "understand-objective-clear",
        phase: "UNDERSTAND",
        name: "Objective Clarity",
        description: "Objective is clearly stated and measurable",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateObjectiveClarity(ctx)
      },
      {
        id: "understand-constraints-identified",
        phase: "UNDERSTAND",
        name: "Constraints Identified",
        description: "All relevant constraints are documented",
        weight: 0.2,
        mandatory: true,
        evaluate: (ctx) => this.evaluateConstraintsIdentified(ctx)
      },
      {
        id: "understand-beneficiaries-known",
        phase: "UNDERSTAND",
        name: "Beneficiaries Known",
        description: "Intended beneficiaries are identified",
        weight: 0.15,
        mandatory: false,
        evaluate: (ctx) => this.evaluateBeneficiariesKnown(ctx)
      }
    ]);

    this.phaseCriteria.set("DECONSTRUCT", [
      {
        id: "deconstruct-components-identified",
        phase: "DECONSTRUCT",
        name: "Components Identified",
        description: "Fundamental components and dependencies are identified",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateComponentsIdentified(ctx)
      },
      {
        id: "deconstruct-assumptions-challenged",
        phase: "DECONSTRUCT",
        name: "Assumptions Challenged",
        description: "Key assumptions are explicitly stated and challenged",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateAssumptionsChallenged(ctx)
      },
      {
        id: "deconstruct-root-causes-investigated",
        phase: "DECONSTRUCT",
        name: "Root Causes Investigated",
        description: "Root causes of the problem are investigated",
        weight: 0.2,
        mandatory: true,
        evaluate: (ctx) => this.evaluateRootCausesInvestigated(ctx)
      }
    ]);

    this.phaseCriteria.set("DISCOVER", [
      {
        id: "discover-relevant-knowledge",
        phase: "DISCOVER",
        name: "Relevant Knowledge Researched",
        description: "Relevant scientific, technical, and domain knowledge is gathered",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateKnowledgeResearched(ctx)
      },
      {
        id: "discover-existing-solutions",
        phase: "DISCOVER",
        name: "Existing Solutions Reviewed",
        description: "Existing solutions and prior failures are reviewed",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateExistingSolutionsReviewed(ctx)
      },
      {
        id: "discover-interdisciplinary-opportunities",
        phase: "DISCOVER",
        name: "Interdisciplinary Opportunities",
        description: "Opportunities for cross-disciplinary synthesis are identified",
        weight: 0.2,
        mandatory: false,
        evaluate: (ctx) => this.evaluateInterdisciplinaryOpportunities(ctx)
      }
    ]);

    this.phaseCriteria.set("ARCHITECT", [
      {
        id: "architect-viable-approaches",
        phase: "ARCHITECT",
        name: "Viable Approaches Generated",
        description: "Multiple viable approaches are generated and compared",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateViableApproaches(ctx)
      },
      {
        id: "architect-tradeoffs-documented",
        phase: "ARCHITECT",
        name: "Trade-offs Documented",
        description: "Trade-offs between approaches are documented",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateTradeoffsDocumented(ctx)
      },
      {
        id: "architect-risks-mapped",
        phase: "ARCHITECT",
        name: "Risks Mapped",
        description: "Dependencies, risks, and failure modes are mapped",
        weight: 0.2,
        mandatory: true,
        evaluate: (ctx) => this.evaluateRisksMapped(ctx)
      },
      {
        id: "architect-simplest-design",
        phase: "ARCHITECT",
        name: "Simplest Sufficient Design",
        description: "The simplest sufficiently capable design is chosen",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateSimplestDesign(ctx)
      }
    ]);

    this.phaseCriteria.set("BUILD", [
      {
        id: "build-functional-solution",
        phase: "BUILD",
        name: "Functional Solution Built",
        description: "Smallest functional solution is implemented",
        weight: 0.4,
        mandatory: true,
        evaluate: (ctx) => this.evaluateFunctionalSolution(ctx)
      },
      {
        id: "build-measurable-results",
        phase: "BUILD",
        name: "Measurable Results",
        description: "Implementation produces measurable results",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateMeasurableResults(ctx)
      },
      {
        id: "build-avoid-complexity",
        phase: "BUILD",
        name: "Avoids Unnecessary Complexity",
        description: "Solution avoids unnecessary complexity",
        weight: 0.3,
        mandatory: false,
        evaluate: (ctx) => this.evaluateAvoidsComplexity(ctx)
      }
    ]);

    this.phaseCriteria.set("EVALUATE", [
      {
        id: "evaluate-against-criteria",
        phase: "EVALUATE",
        name: "Evaluated Against Criteria",
        description: "Solution is evaluated against predefined acceptance criteria",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateAgainstCriteria(ctx)
      },
      {
        id: "evaluate-all-dimensions",
        phase: "EVALUATE",
        name: "All Dimensions Evaluated",
        description: "All applicable evaluation dimensions are assessed",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateAllDimensions(ctx)
      },
      {
        id: "evaluate-evidence-supported",
        phase: "EVALUATE",
        name: "Evidence-Supported Claims",
        description: "All claims are supported by evidence",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateEvidenceSupported(ctx)
      },
      {
        id: "evaluate-no-unverified-claims",
        phase: "EVALUATE",
        name: "No Unverified Claims",
        description: "No unperformed tests or unsupported claims reported as verified",
        weight: 0.2,
        mandatory: true,
        evaluate: (ctx) => this.evaluateNoUnverifiedClaims(ctx)
      }
    ]);

    this.phaseCriteria.set("DIAGNOSE", [
      {
        id: "diagnose-failures-identified",
        phase: "DIAGNOSE",
        name: "Failures Identified",
        description: "Specific failures and weaknesses are identified",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateFailuresIdentified(ctx)
      },
      {
        id: "diagnose-root-causes-determined",
        phase: "DIAGNOSE",
        name: "Root Causes Determined",
        description: "Root causes of underperformance are determined",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateRootCausesDetermined(ctx)
      },
      {
        id: "diagnose-prioritized",
        phase: "DIAGNOSE",
        name: "Issues Prioritized",
        description: "Issues prioritized by severity, impact, likelihood, and correction cost",
        weight: 0.2,
        mandatory: true,
        evaluate: (ctx) => this.evaluateIssuesPrioritized(ctx)
      },
      {
        id: "diagnose-patterns-used",
        phase: "DIAGNOSE",
        name: "Patterns Used in Diagnosis",
        description: "Available pattern-analysis capabilities influence diagnosis",
        weight: 0.2,
        mandatory: false,
        evaluate: (ctx) => this.evaluatePatternsUsed(ctx)
      }
    ]);

    this.phaseCriteria.set("IMPROVE", [
      {
        id: "improve-targeted-corrections",
        phase: "IMPROVE",
        name: "Targeted Corrections",
        description: "Corrections are targeted based on evaluation results",
        weight: 0.35,
        mandatory: true,
        evaluate: (ctx) => this.evaluateTargetedCorrections(ctx)
      },
      {
        id: "improve-not-superficial",
        phase: "IMPROVE",
        name: "Not Superficial",
        description: "Corrections address root causes, not just symptoms",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateNotSuperficial(ctx)
      },
      {
        id: "improve-regression-risk-assessed",
        phase: "IMPROVE",
        name: "Regression Risk Assessed",
        description: "Regression risk of corrections is assessed",
        weight: 0.2,
        mandatory: true,
        evaluate: (ctx) => this.evaluateRegressionRiskAssessed(ctx)
      },
      {
        id: "improve-verification-planned",
        phase: "IMPROVE",
        name: "Verification Planned",
        description: "Verification approach for corrections is planned",
        weight: 0.15,
        mandatory: false,
        evaluate: (ctx) => this.evaluateVerificationPlanned(ctx)
      }
    ]);

    this.phaseCriteria.set("REPEAT", [
      {
        id: "repeat-re-evaluated",
        phase: "REPEAT",
        name: "Re-evaluated",
        description: "Corrected components are re-evaluated",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateReEvaluated(ctx)
      },
      {
        id: "repeat-regression-tests",
        phase: "REPEAT",
        name: "Regression Tests Run",
        description: "Relevant regression tests are re-run",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateRegressionTests(ctx)
      },
      {
        id: "repeat-compared",
        phase: "REPEAT",
        name: "Compared Against Previous",
        description: "Results compared against previous iterations",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateComparedPrevious(ctx)
      },
      {
        id: "repeat-progress-achieved",
        phase: "REPEAT",
        name: "Progress Achieved",
        description: "At least one meaningful outcome (PROGRESS, KNOWLEDGE, CORRECTION)",
        weight: 0.2,
        mandatory: true,
        evaluate: (ctx) => this.evaluateProgressAchieved(ctx)
      }
    ]);

    this.phaseCriteria.set("VALIDATE", [
      {
        id: "validate-independent-checks",
        phase: "VALIDATE",
        name: "Independent Checks",
        description: "Independent verification performed",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateIndependentChecks(ctx)
      },
      {
        id: "validate-boundary-testing",
        phase: "VALIDATE",
        name: "Boundary Testing",
        description: "Edge cases and boundary conditions tested",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateBoundaryTesting(ctx)
      },
      {
        id: "validate-adversarial-testing",
        phase: "VALIDATE",
        name: "Adversarial Testing",
        description: "Adversarial testing performed where appropriate",
        weight: 0.2,
        mandatory: false,
        evaluate: (ctx) => this.evaluateAdversarialTesting(ctx)
      },
      {
        id: "validate-final-verification",
        phase: "VALIDATE",
        name: "Final Verification",
        description: "Final verification against acceptance criteria",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateFinalVerification(ctx)
      }
    ]);

    this.phaseCriteria.set("RELEASE", [
      {
        id: "release-documentation",
        phase: "RELEASE",
        name: "Documentation Prepared",
        description: "Necessary documentation, safeguards, and monitoring prepared",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateDocumentationPrepared(ctx)
      },
      {
        id: "release-recovery-procedures",
        phase: "RELEASE",
        name: "Recovery Procedures",
        description: "Recovery procedures are documented",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateRecoveryProcedures(ctx)
      },
      {
        id: "release-responsible-deployment",
        phase: "RELEASE",
        name: "Responsible Deployment",
        description: "Solution is prepared for responsible deployment",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateResponsibleDeployment(ctx)
      },
      {
        id: "release-monitoring-plan",
        phase: "RELEASE",
        name: "Monitoring Plan",
        description: "Monitoring plan is in place",
        weight: 0.2,
        mandatory: false,
        evaluate: (ctx) => this.evaluateMonitoringPlan(ctx)
      }
    ]);

    this.phaseCriteria.set("EVOLVE", [
      {
        id: "evolve-lessons-captured",
        phase: "EVOLVE",
        name: "Lessons Captured",
        description: "Lessons learned are captured and documented",
        weight: 0.3,
        mandatory: true,
        evaluate: (ctx) => this.evaluateLessonsCaptured(ctx)
      },
      {
        id: "evolve-recurring-issues",
        phase: "EVOLVE",
        name: "Recurring Issues Detected",
        description: "Recurring issues and patterns are detected",
        weight: 0.25,
        mandatory: true,
        evaluate: (ctx) => this.evaluateRecurringIssuesDetected(ctx)
      },
      {
        id: "evolve-real-world-monitoring",
        phase: "EVOLVE",
        name: "Real-World Monitoring",
        description: "Real-world performance monitoring is established",
        weight: 0.25,
        mandatory: false,
        evaluate: (ctx) => this.evaluateRealWorldMonitoring(ctx)
      },
      {
        id: "evolve-future-improvements",
        phase: "EVOLVE",
        name: "Future Improvements",
        description: "New evidence is used to improve future iterations",
        weight: 0.2,
        mandatory: false,
        evaluate: (ctx) => this.evaluateFutureImprovements(ctx)
      }
    ]);
  }

  // Phase evaluation methods
  private evaluateObjectiveClarity(ctx: PRSEContext): CriterionEvaluation {
    const hasObjective = !!ctx.objective && ctx.objective.length > 0;
    const hasMeasurableOutcome = !!ctx.desiredOutcome && ctx.desiredOutcome.length > 0;
    return {
      satisfied: hasObjective && hasMeasurableOutcome,
      score: (hasObjective ? 0.5 : 0) + (hasMeasurableOutcome ? 0.5 : 0),
      evidence: [],
      reasoning: `Objective: ${hasObjective ? "defined" : "missing"}, Measurable outcome: ${hasMeasurableOutcome ? "defined" : "missing"}`
    };
  }

  private evaluateConstraintsIdentified(ctx: PRSEContext): CriterionEvaluation {
    const constraintCount = ctx.constraints.length;
    return {
      satisfied: constraintCount > 0,
      score: Math.min(1, constraintCount * 0.2),
      evidence: [],
      reasoning: `${constraintCount} constraints identified`
    };
  }

  private evaluateBeneficiariesKnown(ctx: PRSEContext): CriterionEvaluation {
    return {
      satisfied: ctx.beneficiaries.length > 0,
      score: ctx.beneficiaries.length > 0 ? 1 : 0,
      evidence: [],
      reasoning: `${ctx.beneficiaries.length} beneficiaries identified`
    };
  }

  private evaluateComponentsIdentified(ctx: PRSEContext): CriterionEvaluation {
    const hasComponentInfo = ctx.assumptions.some(a => a.statement.toLowerCase().includes("component")) ||
                           ctx.evidence.some(e => e.tags.includes("component") || e.tags.includes("dependency"));
    return {
      satisfied: hasComponentInfo,
      score: hasComponentInfo ? 0.8 : 0.3,
      evidence: ctx.evidence.filter(e => e.tags.includes("component") || e.tags.includes("dependency")),
      reasoning: hasComponentInfo ? "Components/dependencies documented" : "No component information found"
    };
  }

  private evaluateAssumptionsChallenged(ctx: PRSEContext): CriterionEvaluation {
    const challengedAssumptions = ctx.assumptions.filter(a => a.validated || a.validationEvidence?.length);
    const totalAssumptions = ctx.assumptions.length;
    if (totalAssumptions === 0) {
      return { satisfied: false, score: 0, evidence: [], reasoning: "No assumptions documented" };
    }
    return {
      satisfied: challengedAssumptions.length > 0,
      score: challengedAssumptions.length / totalAssumptions,
      evidence: challengedAssumptions.flatMap(a => a.validationEvidence || []),
      reasoning: `${challengedAssumptions.length}/${totalAssumptions} assumptions validated/challenged`
    };
  }

  private evaluateRootCausesInvestigated(ctx: PRSEContext): CriterionEvaluation {
    const rootCauseEvidence = ctx.evidence.filter(e => e.tags.includes("root-cause") || e.tags.includes("root_cause"));
    return {
      satisfied: rootCauseEvidence.length > 0,
      score: Math.min(1, rootCauseEvidence.length * 0.3),
      evidence: rootCauseEvidence,
      reasoning: `${rootCauseEvidence.length} root cause evidence items`
    };
  }

  private evaluateKnowledgeResearched(ctx: PRSEContext): CriterionEvaluation {
    const researchEvidence = ctx.evidence.filter(e => e.type === "EXTERNAL_CLAIM" || e.type === "OBSERVED_FACT");
    const scientificEvidence = researchEvidence.filter(e => e.tags.includes("scientific") || e.tags.includes("research"));
    return {
      satisfied: researchEvidence.length > 0,
      score: Math.min(1, (researchEvidence.length + scientificEvidence.length) * 0.15),
      evidence: researchEvidence,
      reasoning: `${researchEvidence.length} research evidence items, ${scientificEvidence.length} scientific`
    };
  }

  private evaluateExistingSolutionsReviewed(ctx: PRSEContext): CriterionEvaluation {
    const existingSolutions = ctx.evidence.filter(e => e.tags.includes("existing-solution") || e.tags.includes("prior-art"));
    return {
      satisfied: existingSolutions.length > 0,
      score: Math.min(1, existingSolutions.length * 0.25),
      evidence: existingSolutions,
      reasoning: `${existingSolutions.length} existing solutions reviewed`
    };
  }

  private evaluateInterdisciplinaryOpportunities(ctx: PRSEContext): CriterionEvaluation {
    const interdisciplinaryEvidence = ctx.evidence.filter(e => e.tags.includes("interdisciplinary") || e.tags.includes("cross-discipline"));
    return {
      satisfied: interdisciplinaryEvidence.length > 0,
      score: Math.min(1, interdisciplinaryEvidence.length * 0.3),
      evidence: interdisciplinaryEvidence,
      reasoning: `${interdisciplinaryEvidence.length} interdisciplinary opportunities identified`
    };
  }

  private evaluateViableApproaches(ctx: PRSEContext): CriterionEvaluation {
    const approachDecisions = ctx.assumptions.filter(a => a.statement.toLowerCase().includes("approach") || a.statement.toLowerCase().includes("design"));
    return {
      satisfied: approachDecisions.length > 1,
      score: Math.min(1, approachDecisions.length * 0.25),
      evidence: [],
      reasoning: `${approachDecisions.length} design approaches considered`
    };
  }

  private evaluateTradeoffsDocumented(ctx: PRSEContext): CriterionEvaluation {
    const tradeoffEvidence = ctx.evidence.filter(e => e.tags.includes("tradeoff") || e.tags.includes("trade-off"));
    return {
      satisfied: tradeoffEvidence.length > 0,
      score: Math.min(1, tradeoffEvidence.length * 0.3),
      evidence: tradeoffEvidence,
      reasoning: `${tradeoffEvidence.length} trade-offs documented`
    };
  }

  private evaluateRisksMapped(ctx: PRSEContext): CriterionEvaluation {
    const riskEvidence = ctx.evidence.filter(e => e.tags.includes("risk"));
    return {
      satisfied: riskEvidence.length > 0,
      score: Math.min(1, riskEvidence.length * 0.2),
      evidence: riskEvidence,
      reasoning: `${riskEvidence.length} risks identified`
    };
  }

  private evaluateSimplestDesign(ctx: PRSEContext): CriterionEvaluation {
    const simplicityDecisions = ctx.assumptions.filter(a =>
      a.statement.toLowerCase().includes("simple") ||
      a.statement.toLowerCase().includes("minimal") ||
      a.statement.toLowerCase().includes("yagni")
    );
    return {
      satisfied: simplicityDecisions.length > 0,
      score: Math.min(1, simplicityDecisions.length * 0.3),
      evidence: [],
      reasoning: `${simplicityDecisions.length} simplicity-related decisions`
    };
  }

  private evaluateFunctionalSolution(ctx: PRSEContext): CriterionEvaluation {
    const hasTrace = !!ctx.trace;
    const hasArtifacts = ctx.evidence.some(e => e.type === "VERIFIED_RESULT");
    return {
      satisfied: hasTrace && hasArtifacts,
      score: (hasTrace ? 0.5 : 0) + (hasArtifacts ? 0.5 : 0),
      evidence: ctx.evidence.filter(e => e.type === "VERIFIED_RESULT"),
      reasoning: `Trace: ${hasTrace ? "yes" : "no"}, Verified artifacts: ${hasArtifacts ? "yes" : "no"}`
    };
  }

  private evaluateMeasurableResults(ctx: PRSEContext): CriterionEvaluation {
    const measurableEvidence = ctx.evidence.filter(e => e.type === "VERIFIED_RESULT" && (e.content.includes("measure") || e.content.includes("metric")));
    return {
      satisfied: measurableEvidence.length > 0,
      score: Math.min(1, measurableEvidence.length * 0.3),
      evidence: measurableEvidence,
      reasoning: `${measurableEvidence.length} measurable results`
    };
  }

  private evaluateAvoidsComplexity(ctx: PRSEContext): CriterionEvaluation {
    const minimalismEvidence = ctx.evidence.filter(e => e.tags.includes("minimalism") || e.tags.includes("yagni"));
    return {
      satisfied: minimalismEvidence.length > 0,
      score: Math.min(1, minimalismEvidence.length * 0.4),
      evidence: minimalismEvidence,
      reasoning: `${minimalismEvidence.length} minimalism evidence items`
    };
  }

  private evaluateAgainstCriteria(ctx: PRSEContext): CriterionEvaluation {
    if (!ctx.trace) {
      return { satisfied: false, score: 0, evidence: [], reasoning: "No execution trace available" };
    }
    return {
      satisfied: ctx.evidence.some(e => e.type === "VERIFIED_RESULT"),
      score: ctx.evidence.filter(e => e.type === "VERIFIED_RESULT").length > 0 ? 0.7 : 0.2,
      evidence: ctx.evidence.filter(e => e.type === "VERIFIED_RESULT"),
      reasoning: "Evaluated against acceptance criteria"
    };
  }

  private evaluateAllDimensions(ctx: PRSEContext): CriterionEvaluation {
    const requiredDimensions = ["CORRECTNESS", "COMPLETENESS", "RELIABILITY", "SECURITY"];
    const evaluatedDimensions = requiredDimensions.filter(dim =>
      ctx.evidence.some(e => e.tags.includes(dim.toLowerCase()))
    );
    return {
      satisfied: evaluatedDimensions.length === requiredDimensions.length,
      score: evaluatedDimensions.length / requiredDimensions.length,
      evidence: [],
      reasoning: `${evaluatedDimensions.length}/${requiredDimensions.length} required dimensions evaluated`
    };
  }

  private evaluateEvidenceSupported(ctx: PRSEContext): CriterionEvaluation {
    const claims = ctx.evidence.filter(e => e.type === "MODEL_JUDGMENT" || e.type === "HYPOTHESIS");
    const supportedClaims = claims.filter(c => c.confidence > 0.7);
    if (claims.length === 0) return { satisfied: true, score: 1, evidence: [], reasoning: "No claims requiring evidence" };
    return {
      satisfied: supportedClaims.length === claims.length,
      score: supportedClaims.length / claims.length,
      evidence: supportedClaims,
      reasoning: `${supportedClaims.length}/${claims.length} claims well-supported`
    };
  }

  private evaluateNoUnverifiedClaims(ctx: PRSEContext): CriterionEvaluation {
    const unverifiedClaims = ctx.evidence.filter(e =>
      (e.type === "MODEL_JUDGMENT" || e.type === "HYPOTHESIS") &&
      e.confidence < 0.5 &&
      !e.tags.includes("unverified")
    );
    return {
      satisfied: unverifiedClaims.length === 0,
      score: unverifiedClaims.length === 0 ? 1 : Math.max(0, 1 - unverifiedClaims.length * 0.2),
      evidence: unverifiedClaims,
      reasoning: `${unverifiedClaims.length} unverified claims found`
    };
  }

  private evaluateFailuresIdentified(ctx: PRSEContext): CriterionEvaluation {
    const failureEvidence = ctx.evidence.filter(e => e.type === "VERIFIED_RESULT" && e.content.toLowerCase().includes("fail"));
    return {
      satisfied: failureEvidence.length > 0 || (ctx.trace?.errors.length || 0) > 0,
      score: Math.min(1, (failureEvidence.length + (ctx.trace?.errors.length || 0)) * 0.2),
      evidence: failureEvidence,
      reasoning: `${failureEvidence.length} failures identified in evidence, ${ctx.trace?.errors.length || 0} in trace`
    };
  }

  private evaluateRootCausesDetermined(ctx: PRSEContext): CriterionEvaluation {
    const rootCauseEvidence = ctx.evidence.filter(e => e.tags.includes("root-cause") || e.tags.includes("root_cause"));
    const diagnosedIssues = ctx.currentPhase === "DIAGNOSE" ? ctx.iterationHistory[ctx.iterationHistory.length - 1]?.issuesFound.length || 0 : 0;
    return {
      satisfied: rootCauseEvidence.length > 0 || diagnosedIssues > 0,
      score: Math.min(1, (rootCauseEvidence.length + diagnosedIssues) * 0.2),
      evidence: rootCauseEvidence,
      reasoning: `${rootCauseEvidence.length} root cause evidence, ${diagnosedIssues} diagnosed issues`
    };
  }

  private evaluateIssuesPrioritized(ctx: PRSEContext): CriterionEvaluation {
    const currentIteration = ctx.iterationHistory[ctx.iterationHistory.length - 1];
    const issues = currentIteration?.issuesFound || [];
    const hasCritical = issues.some(i => i.severity === "CRITICAL");
    const hasHigh = issues.some(i => i.severity === "HIGH");
    return {
      satisfied: issues.length > 0 && (hasCritical || hasHigh),
      score: issues.length > 0 ? (hasCritical ? 1 : hasHigh ? 0.7 : 0.4) : 0,
      evidence: [],
      reasoning: `${issues.length} issues, critical: ${hasCritical}, high: ${hasHigh}`
    };
  }

  private evaluatePatternsUsed(ctx: PRSEContext): CriterionEvaluation {
    const patternEvidence = ctx.patterns.filter(p => p.status === "VALIDATED");
    return {
      satisfied: patternEvidence.length > 0,
      score: Math.min(1, patternEvidence.length * 0.2),
      evidence: patternEvidence.flatMap(p => p.supportingEvidence),
      reasoning: `${patternEvidence.length} validated patterns available for diagnosis`
    };
  }

  private evaluateTargetedCorrections(ctx: PRSEContext): CriterionEvaluation {
    const currentIteration = ctx.iterationHistory[ctx.iterationHistory.length - 1];
    const corrections = currentIteration?.correctionsApplied || [];
    const targetedCorrections = corrections.filter(c => c.type === "FIX" || c.type === "REFACTOR");
    return {
      satisfied: corrections.length > 0 && targetedCorrections.length > 0,
      score: corrections.length > 0 ? targetedCorrections.length / corrections.length : 0,
      evidence: [],
      reasoning: `${targetedCorrections.length}/${corrections.length} corrections are targeted`
    };
  }

  private evaluateNotSuperficial(ctx: PRSEContext): CriterionEvaluation {
    const currentIteration = ctx.iterationHistory[ctx.iterationHistory.length - 1];
    const corrections = currentIteration?.correctionsApplied || [];
    const rootCauseCorrections = corrections.filter(c => c.type === "FIX" && c.verificationResult === "PASS");
    return {
      satisfied: rootCauseCorrections.length > 0,
      score: corrections.length > 0 ? rootCauseCorrections.length / corrections.length : 0,
      evidence: [],
      reasoning: `${rootCauseCorrections.length}/${corrections.length} corrections address root causes`
    };
  }

  private evaluateRegressionRiskAssessed(ctx: PRSEContext): CriterionEvaluation {
    const currentIteration = ctx.iterationHistory[ctx.iterationHistory.length - 1];
    const corrections = currentIteration?.correctionsApplied || [];
    const assessedCorrections = corrections.filter(c => c.regressionRisk !== "NONE");
    return {
      satisfied: assessedCorrections.length === corrections.length && corrections.length > 0,
      score: corrections.length > 0 ? assessedCorrections.length / corrections.length : 0,
      evidence: [],
      reasoning: `${assessedCorrections.length}/${corrections.length} corrections have regression risk assessed`
    };
  }

  private evaluateVerificationPlanned(ctx: PRSEContext): CriterionEvaluation {
    const currentIteration = ctx.iterationHistory[ctx.iterationHistory.length - 1];
    const corrections = currentIteration?.correctionsApplied || [];
    const withVerification = corrections.filter(c => c.verificationResult);
    return {
      satisfied: withVerification.length > 0,
      score: corrections.length > 0 ? withVerification.length / corrections.length : 0,
      evidence: [],
      reasoning: `${withVerification.length}/${corrections.length} corrections have verification planned`
    };
  }

  private evaluateReEvaluated(ctx: PRSEContext): CriterionEvaluation {
    const currentIteration = ctx.iterationHistory[ctx.iterationHistory.length - 1];
    return {
      satisfied: currentIteration?.evaluations.length > 0,
      score: currentIteration?.evaluations.length > 0 ? Math.min(1, currentIteration.evaluations.length * 0.2) : 0,
      evidence: [],
      reasoning: `${currentIteration?.evaluations.length || 0} evaluations in current iteration`
    };
  }

  private evaluateRegressionTests(ctx: PRSEContext): CriterionEvaluation {
    const currentIteration = ctx.iterationHistory[ctx.iterationHistory.length - 1];
    const hasRegressionTests = currentIteration?.correctionsApplied.some(c => c.type === "ADD_TEST") || false;
    return {
      satisfied: hasRegressionTests,
      score: hasRegressionTests ? 1 : 0,
      evidence: [],
      reasoning: hasRegressionTests ? "Regression tests added" : "No regression tests added"
    };
  }

  private evaluateComparedPrevious(ctx: PRSEContext): CriterionEvaluation {
    if (ctx.iterationHistory.length < 2) {
      return { satisfied: true, score: 1, evidence: [], reasoning: "First iteration, no comparison needed" };
    }
    const current = ctx.iterationHistory[ctx.iterationHistory.length - 1];
    const previous = ctx.iterationHistory[ctx.iterationHistory.length - 2];
    const currentIssues = current.issuesFound.length;
    const previousIssues = previous.issuesFound.length;
    return {
      satisfied: currentIssues <= previousIssues,
      score: currentIssues <= previousIssues ? 1 : 0.5,
      evidence: [],
      reasoning: `Issues: previous ${previousIssues}, current ${currentIssues}`
    };
  }

  private evaluateProgressAchieved(ctx: PRSEContext): CriterionEvaluation {
    const currentIteration = ctx.iterationHistory[ctx.iterationHistory.length - 1];
    const hasProgress = currentIteration?.issuesFound.some(i => i.severity === "CRITICAL" || i.severity === "HIGH") === false &&
                       currentIteration?.issuesFound.length < (ctx.iterationHistory[ctx.iterationHistory.length - 2]?.issuesFound.length || Infinity);
    return {
      satisfied: hasProgress,
      score: hasProgress ? 1 : 0.3,
      evidence: [],
      reasoning: hasProgress ? "Meaningful progress achieved" : "Limited progress"
    };
  }

  private evaluateIndependentChecks(ctx: PRSEContext): CriterionEvaluation {
    const independentEvidence = ctx.evidence.filter(e => e.type === "OBSERVED_FACT" && e.source !== "sovereign");
    return {
      satisfied: independentEvidence.length > 0,
      score: Math.min(1, independentEvidence.length * 0.25),
      evidence: independentEvidence,
      reasoning: `${independentEvidence.length} independent evidence items`
    };
  }

  private evaluateBoundaryTesting(ctx: PRSEContext): CriterionEvaluation {
    const boundaryEvidence = ctx.evidence.filter(e => e.tags.includes("boundary") || e.tags.includes("edge-case"));
    return {
      satisfied: boundaryEvidence.length > 0,
      score: Math.min(1, boundaryEvidence.length * 0.3),
      evidence: boundaryEvidence,
      reasoning: `${boundaryEvidence.length} boundary/edge case tests`
    };
  }

  private evaluateAdversarialTesting(ctx: PRSEContext): CriterionEvaluation {
    const adversarialEvidence = ctx.evidence.filter(e => e.tags.includes("adversarial") || e.tags.includes("attack"));
    return {
      satisfied: adversarialEvidence.length > 0,
      score: Math.min(1, adversarialEvidence.length * 0.4),
      evidence: adversarialEvidence,
      reasoning: `${adversarialEvidence.length} adversarial tests`
    };
  }

  private evaluateFinalVerification(ctx: PRSEContext): CriterionEvaluation {
    const verificationEvidence = ctx.evidence.filter(e => e.tags.includes("verification") || e.tags.includes("final"));
    return {
      satisfied: verificationEvidence.length > 0,
      score: Math.min(1, verificationEvidence.length * 0.3),
      evidence: verificationEvidence,
      reasoning: `${verificationEvidence.length} final verification items`
    };
  }

  private evaluateDocumentationPrepared(ctx: PRSEContext): CriterionEvaluation {
    const docEvidence = ctx.evidence.filter(e => e.tags.includes("documentation"));
    return {
      satisfied: docEvidence.length > 0,
      score: Math.min(1, docEvidence.length * 0.3),
      evidence: docEvidence,
      reasoning: `${docEvidence.length} documentation artifacts`
    };
  }

  private evaluateRecoveryProcedures(ctx: PRSEContext): CriterionEvaluation {
    const recoveryEvidence = ctx.evidence.filter(e => e.tags.includes("recovery") || e.tags.includes("rollback"));
    return {
      satisfied: recoveryEvidence.length > 0,
      score: Math.min(1, recoveryEvidence.length * 0.4),
      evidence: recoveryEvidence,
      reasoning: `${recoveryEvidence.length} recovery procedures`
    };
  }

  private evaluateResponsibleDeployment(ctx: PRSEContext): CriterionEvaluation {
    const deploymentEvidence = ctx.evidence.filter(e => e.tags.includes("deployment") || e.tags.includes("release"));
    return {
      satisfied: deploymentEvidence.length > 0,
      score: Math.min(1, deploymentEvidence.length * 0.3),
      evidence: deploymentEvidence,
      reasoning: `${deploymentEvidence.length} deployment artifacts`
    };
  }

  private evaluateMonitoringPlan(ctx: PRSEContext): CriterionEvaluation {
    const monitoringEvidence = ctx.evidence.filter(e => e.tags.includes("monitoring") || e.tags.includes("observability"));
    return {
      satisfied: monitoringEvidence.length > 0,
      score: Math.min(1, monitoringEvidence.length * 0.4),
      evidence: monitoringEvidence,
      reasoning: `${monitoringEvidence.length} monitoring artifacts`
    };
  }

  private evaluateLessonsCaptured(ctx: PRSEContext): CriterionEvaluation {
    const lessonEvidence = ctx.evidence.filter(e => e.tags.includes("lesson") || e.tags.includes("learning"));
    return {
      satisfied: lessonEvidence.length > 0,
      score: Math.min(1, lessonEvidence.length * 0.3),
      evidence: lessonEvidence,
      reasoning: `${lessonEvidence.length} lessons captured`
    };
  }

  private evaluateRecurringIssuesDetected(ctx: PRSEContext): CriterionEvaluation {
    const recurringPatterns = ctx.patterns.filter(p => p.status === "VALIDATED" && p.occurrenceCount >= 3);
    return {
      satisfied: recurringPatterns.length > 0,
      score: Math.min(1, recurringPatterns.length * 0.3),
      evidence: recurringPatterns.flatMap(p => p.supportingEvidence),
      reasoning: `${recurringPatterns.length} recurring validated patterns`
    };
  }

  private evaluateRealWorldMonitoring(ctx: PRSEContext): CriterionEvaluation {
    const monitoringEvidence = ctx.evidence.filter(e => e.tags.includes("monitoring") || e.tags.includes("production"));
    return {
      satisfied: monitoringEvidence.length > 0,
      score: Math.min(1, monitoringEvidence.length * 0.3),
      evidence: monitoringEvidence,
      reasoning: `${monitoringEvidence.length} real-world monitoring items`
    };
  }

  private evaluateFutureImprovements(ctx: PRSEContext): CriterionEvaluation {
    const improvementEvidence = ctx.evidence.filter(e => e.tags.includes("improvement") || e.tags.includes("future"));
    return {
      satisfied: improvementEvidence.length > 0,
      score: Math.min(1, improvementEvidence.length * 0.3),
      evidence: improvementEvidence,
      reasoning: `${improvementEvidence.length} future improvement items`
    };
  }

  // Public API
  async startSession(context: Omit<PRSEContext, "iterationHistory" | "evidence" | "patterns" | "judgments" | "currentPhase">): Promise<PRSEContext> {
    this.currentContext = {
      ...context,
      iterationHistory: [],
      evidence: [],
      patterns: [],
      judgments: [],
      currentPhase: "UNDERSTAND"
    };
    this.iterationCounter = 0;
    return this.currentContext;
  }

  async executePhase(phase: PRSEPhase): Promise<PhaseOutput> {
    if (!this.currentContext) {
      throw new Error("No active PRSE session. Call startSession first.");
    }

    this.currentContext.currentPhase = phase;
    this.iterationCounter++;

    const iteration: any = {
      id: `iter-${Date.now()}-${this.iterationCounter}`,
      iterationNumber: this.iterationCounter,
      phase,
      startedAt: new Date(),
      status: "IN_PROGRESS",
      inputs: { phase },
      outputs: {},
      evaluations: [],
      issuesFound: [],
      correctionsApplied: [],
      timeSpentMs: 0
    };

    const output = await this.executePhaseLogic(phase, iteration);

    iteration.outputs = { ...output, evidence: output.evidence };
    iteration.evaluations = await this.evaluatePhase(phase);
    iteration.completedAt = new Date();
    iteration.timeSpentMs = iteration.completedAt.getTime() - iteration.startedAt.getTime();
    iteration.status = "COMPLETED";

    this.currentContext.iterationHistory.push(iteration);
    this.currentContext.evidence.push(...output.evidence);

    if (output.artifacts.length > 0) {
      for (const artifact of output.artifacts) {
        this.patternAnalysis.addObservation({
          id: `obs-${artifact.id}`,
          taskId: `prse-${phase.toLowerCase()}`,
          type: "ARTIFACT",
          data: { phase, artifactType: artifact.type },
          timestamp: new Date(),
          tags: ["prse", phase.toLowerCase(), artifact.type.toLowerCase()]
        });
      }
    }

    this.memory.store({
      category: "PROCEDURAL",
      content: `PRSE ${phase} phase completed`,
      source: "prse-engine",
      context: `iteration-${this.iterationCounter}`,
      scope: "prse-session",
      supportingEvidence: output.evidence,
      validationStatus: "VALIDATED",
      confidence: 0.9,
      tags: ["prse", phase.toLowerCase()],
      revalidationConditions: []
    });

    const phaseNode = this.outcomeGraph.createNode("ARTIFACT", `PRSE ${phase}`, { phase });
    if (this.currentContext.iterationHistory.length > 1) {
      const prevPhase = this.currentContext.iterationHistory[this.currentContext.iterationHistory.length - 2].phase;
      const prevNode = this.outcomeGraph.getNodesByType("ARTIFACT").find(n => n.label === `PRSE ${prevPhase}`);
      if (prevNode) {
        this.outcomeGraph.createEdge(prevNode.id, phaseNode.id, "INFORMED");
      }
    }

    return output;
  }

  private async executePhaseLogic(phase: PRSEPhase, _iteration: any): Promise<PhaseOutput> {
    return {
      phase,
      artifacts: [],
      decisions: [],
      evidence: [],
      assumptionsValidated: [],
      assumptionsInvalidated: [],
      newQuestions: [],
      riskAssessment: {
        risks: [],
        overallRiskLevel: "LOW",
        mitigationStrategies: []
      }
    };
  }

  private async evaluatePhase(phase: PRSEPhase): Promise<CriterionEvaluation[]> {
    if (!this.currentContext) return [];

    const criteria = this.phaseCriteria.get(phase) || [];
    const evaluations: CriterionEvaluation[] = [];

    for (const criterion of criteria) {
      const result = criterion.evaluate(this.currentContext);
      evaluations.push(result);
    }

    return evaluations;
  }

  checkStoppingConditions(): { shouldStop: boolean; reason?: string; condition?: any } {
    if (!this.currentContext) return { shouldStop: false };

    const totalTime = this.currentContext.iterationHistory.reduce((sum, iter) => sum + iter.timeSpentMs, 0);
    if (totalTime >= this.config.timeBudgetMs) {
      const condition = this.config.stoppingConditions.find(c => c.type === "BUDGET_EXHAUSTED");
      return { shouldStop: true, reason: "Time budget exhausted", condition };
    }

    if (this.iterationCounter >= this.config.maxIterations) {
      const condition = this.config.stoppingConditions.find(c => c.type === "MAX_ITERATIONS");
      return { shouldStop: true, reason: "Maximum iterations reached", condition };
    }

    if (this.currentContext.iterationHistory.length > 0) {
      const latestIteration = this.currentContext.iterationHistory[this.currentContext.iterationHistory.length - 1];
      const mandatoryEvaluations = latestIteration.evaluations.filter(e => {
        const criterion = this.phaseCriteria.get(latestIteration.phase)?.find(c => c.id === e.reasoning);
        return criterion?.mandatory;
      });
      const allMandatoryPass = mandatoryEvaluations.every(e => e.satisfied);
      if (allMandatoryPass && mandatoryEvaluations.length > 0) {
        const condition = this.config.stoppingConditions.find(c => c.type === "ALL_MANDATORY_PASS");
        return { shouldStop: true, reason: "All mandatory criteria satisfied", condition };
      }
    }

    if (this.iterationCounter >= 3) {
      const recentIterations = this.currentContext.iterationHistory.slice(-3);
      const noProgress = recentIterations.every(iter =>
        iter.issuesFound.length === 0 && iter.correctionsApplied.length === 0
      );
      if (noProgress) {
        const condition = this.config.stoppingConditions.find(c => c.type === "NO_PROGRESS");
        return { shouldStop: true, reason: "No meaningful progress in 3 iterations", condition };
      }
    }

    return { shouldStop: false };
  }

  getIterationSummary(): any | null {
    if (!this.currentContext || this.currentContext.iterationHistory.length === 0) return null;

    const currentIteration = this.currentContext.iterationHistory[this.currentContext.iterationHistory.length - 1];
    const previousIteration = this.currentContext.iterationHistory[this.currentContext.iterationHistory.length - 2];

    return {
      iterationId: currentIteration.id,
      outcome: this.determineIterationOutcome(currentIteration, previousIteration),
      progressMetrics: {
        issuesResolved: previousIteration ? previousIteration.issuesFound.length - currentIteration.issuesFound.length : 0,
        criteriaImproved: currentIteration.evaluations.filter(e => e.satisfied).length,
        criteriaRegressed: previousIteration ?
          previousIteration.evaluations.filter(e => !e.satisfied).length -
          currentIteration.evaluations.filter(e => !e.satisfied).length : 0
      },
      issuesResolved: previousIteration ? Math.max(0, previousIteration.issuesFound.length - currentIteration.issuesFound.length) : 0,
      issuesNew: currentIteration.issuesFound.length,
      criteriaImproved: currentIteration.evaluations.filter(e => e.satisfied).map(e => e.reasoning),
      criteriaRegressed: [],
      evidenceCollected: (currentIteration.outputs["evidence"] as unknown[] | undefined)?.length || 0,
      timeSpentMs: currentIteration.timeSpentMs
    };
  }

  private determineIterationOutcome(current: any, previous?: any): IterationOutcome {
    if (current.correctionsApplied.length > 0) return "CORRECTION";
    if (current.evaluations.some((e: any) => !e.satisfied && e.evidence.length > 0)) return "KNOWLEDGE";
    if (previous && current.issuesFound.length < previous.issuesFound.length) return "PROGRESS";
    if (current.issuesFound.length === 0 && current.correctionsApplied.length === 0) return "EXHAUSTED";
    return "KNOWLEDGE";
  }

  getCurrentContext(): PRSEContext | null {
    return this.currentContext;
  }

  getIterationHistory(): any[] {
    return this.currentContext?.iterationHistory || [];
  }

  analyzePatterns(): any[] {
    if (!this.config.enablePatternAnalysis) return [];
    return this.patternAnalysis.discoverPatterns();
  }

  generateReport(): string {
    if (!this.currentContext) return "No active session";

    const totalTime = this.currentContext.iterationHistory.reduce((sum, iter) => sum + iter.timeSpentMs, 0);
    const totalIssues = this.currentContext.iterationHistory.reduce((sum, iter) => sum + iter.issuesFound.length, 0);
    const totalCorrections = this.currentContext.iterationHistory.reduce((sum, iter) => sum + iter.correctionsApplied.length, 0);
    const latestIteration = this.currentContext.iterationHistory[this.currentContext.iterationHistory.length - 1];

    return `
# PRSE Session Report

**Objective:** ${this.currentContext.objective}
**Total Iterations:** ${this.iterationCounter}
**Total Time:** ${(totalTime / 1000 / 60).toFixed(1)} minutes
**Total Issues Found:** ${totalIssues}
**Total Corrections Applied:** ${totalCorrections}

## Latest Iteration (${latestIteration?.iterationNumber || 0})
**Phase:** ${latestIteration?.phase || "N/A"}
**Status:** ${latestIteration?.status || "N/A"}
**Evaluations:** ${latestIteration?.evaluations.length || 0}
**Issues Found:** ${latestIteration?.issuesFound.length || 0}
**Corrections Applied:** ${latestIteration?.correctionsApplied.length || 0}

## Phase Evaluations
${this.currentContext.iterationHistory.map(iter =>
  `- **${iter.phase}** (Iter ${iter.iterationNumber}): ${iter.evaluations.length} criteria, ${iter.evaluations.filter(e => e.satisfied).length} passed`
).join("\n")}

## Stopping Condition
${JSON.stringify(this.checkStoppingConditions(), null, 2)}
`.trim();
  }
}

export { PRSE_PHASES, EVALUATION_DIMENSIONS, DEFAULT_PRSE_CONFIG, calculateExcellence } from "./types.js";

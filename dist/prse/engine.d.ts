/**
 * PRSE Engine
 * Implements the Principle of Recursive Systems Engineering workflow
 */
import { PRSEPhase, PRSEConfig, PRSEContext, PhaseOutput } from "./types.js";
import { PatternAnalysisEngine } from "../pattern-analysis.js";
import { MemorySystem } from "../memory.js";
import { OutcomeGraph } from "../outcome-graph.js";
export interface PRSEEngineOptions {
    config?: Partial<PRSEConfig>;
    patternAnalysis?: PatternAnalysisEngine;
    memory?: MemorySystem;
    outcomeGraph?: OutcomeGraph;
}
export declare class PRSEEngine {
    private config;
    private patternAnalysis;
    private memory;
    private outcomeGraph;
    private currentContext;
    private iterationCounter;
    private phaseCriteria;
    constructor(options?: PRSEEngineOptions);
    private initializePhaseCriteria;
    private evaluateObjectiveClarity;
    private evaluateConstraintsIdentified;
    private evaluateBeneficiariesKnown;
    private evaluateComponentsIdentified;
    private evaluateAssumptionsChallenged;
    private evaluateRootCausesInvestigated;
    private evaluateKnowledgeResearched;
    private evaluateExistingSolutionsReviewed;
    private evaluateInterdisciplinaryOpportunities;
    private evaluateViableApproaches;
    private evaluateTradeoffsDocumented;
    private evaluateRisksMapped;
    private evaluateSimplestDesign;
    private evaluateFunctionalSolution;
    private evaluateMeasurableResults;
    private evaluateAvoidsComplexity;
    private evaluateAgainstCriteria;
    private evaluateAllDimensions;
    private evaluateEvidenceSupported;
    private evaluateNoUnverifiedClaims;
    private evaluateFailuresIdentified;
    private evaluateRootCausesDetermined;
    private evaluateIssuesPrioritized;
    private evaluatePatternsUsed;
    private evaluateTargetedCorrections;
    private evaluateNotSuperficial;
    private evaluateRegressionRiskAssessed;
    private evaluateVerificationPlanned;
    private evaluateReEvaluated;
    private evaluateRegressionTests;
    private evaluateComparedPrevious;
    private evaluateProgressAchieved;
    private evaluateIndependentChecks;
    private evaluateBoundaryTesting;
    private evaluateAdversarialTesting;
    private evaluateFinalVerification;
    private evaluateDocumentationPrepared;
    private evaluateRecoveryProcedures;
    private evaluateResponsibleDeployment;
    private evaluateMonitoringPlan;
    private evaluateLessonsCaptured;
    private evaluateRecurringIssuesDetected;
    private evaluateRealWorldMonitoring;
    private evaluateFutureImprovements;
    startSession(context: Omit<PRSEContext, "iterationHistory" | "evidence" | "patterns" | "judgments" | "currentPhase">): Promise<PRSEContext>;
    executePhase(phase: PRSEPhase): Promise<PhaseOutput>;
    private executePhaseLogic;
    private evaluatePhase;
    checkStoppingConditions(): {
        shouldStop: boolean;
        reason?: string;
        condition?: any;
    };
    getIterationSummary(): any | null;
    private determineIterationOutcome;
    getCurrentContext(): PRSEContext | null;
    getIterationHistory(): any[];
    analyzePatterns(): any[];
    generateReport(): string;
}
export { PRSE_PHASES, EVALUATION_DIMENSIONS, DEFAULT_PRSE_CONFIG, calculateExcellence } from "./types.js";
//# sourceMappingURL=engine.d.ts.map
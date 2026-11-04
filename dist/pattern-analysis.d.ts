/**
 * SOVEREIGN Pattern Analysis Engine
 * Detects meaningful patterns across execution traces (Part 7)
 */
import { PatternRecord, PatternStatus, Evidence, ExecutionTrace } from "./types.js";
export interface Observation {
    id: string;
    taskId: string;
    type: string;
    data: Record<string, unknown>;
    timestamp: Date;
    tags: string[];
}
export interface PatternAnalysisOptions {
    minOccurrences: number;
    measurementWindowDays: number;
    similarityThreshold: number;
}
export declare class PatternAnalysisEngine {
    private observations;
    private patterns;
    private options;
    constructor(options?: Partial<PatternAnalysisOptions>);
    addObservation(observation: Observation): void;
    addObservations(observations: Observation[]): void;
    getObservations(taskId?: string): Observation[];
    extractFeatures(observation: Observation): Record<string, unknown>;
    discoverPatterns(): PatternRecord[];
    private findFailurePatterns;
    private findToolPatterns;
    private findEvaluationPatterns;
    private findResourcePatterns;
    validatePattern(patternId: string, _evidence: Evidence[]): {
        validated: boolean;
        confidence: number;
        notes: string[];
    };
    getPatterns(status?: PatternStatus): PatternRecord[];
    getPattern(id: string): PatternRecord | undefined;
    analyzeTrends(): TrendAnalysis[];
}
export interface TrendAnalysis {
    metric: string;
    category: string;
    windowDays: number;
    value: number;
    timestamp: Date;
}
export declare function createObservationFromTrace(trace: ExecutionTrace): Observation[];
//# sourceMappingURL=pattern-analysis.d.ts.map
/**
 * SOVEREIGN Pattern Analysis Engine
 * Detects meaningful patterns across execution traces (Part 7)
 */

import {
  PatternRecord,
  PatternStatus,
  Evidence,
  ExecutionTrace
} from "./types.js";

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

export class PatternAnalysisEngine {
  private observations: Observation[] = [];
  private patterns: PatternRecord[] = [];
  private options: PatternAnalysisOptions;

  constructor(options: Partial<PatternAnalysisOptions> = {}) {
    this.options = {
      minOccurrences: options.minOccurrences ?? 3,
      measurementWindowDays: options.measurementWindowDays ?? 30,
      similarityThreshold: options.similarityThreshold ?? 0.7
    };
  }

  addObservation(observation: Observation): void {
    this.observations.push(observation);
  }

  addObservations(observations: Observation[]): void {
    this.observations.push(...observations);
  }

  getObservations(taskId?: string): Observation[] {
    if (taskId) {
      return this.observations.filter(o => o.taskId === taskId);
    }
    return [...this.observations];
  }

  extractFeatures(observation: Observation): Record<string, unknown> {
    const features: Record<string, unknown> = {
      type: observation.type,
      timestamp: observation.timestamp.getTime(),
      tags: observation.tags,
      dataKeys: Object.keys(observation.data)
    };

    switch (observation.type) {
      case "FAILURE":
        features.failureCategory = observation.data.category;
        features.errorMessage = observation.data.message;
        features.recoverable = observation.data.recoverable;
        break;
      case "TOOL_CALL":
        features.toolName = observation.data.toolName;
        features.status = observation.data.status;
        features.duration = observation.data.duration;
        break;
      case "EVALUATION":
        features.verdict = observation.data.verdict;
        features.score = observation.data.score;
        break;
      case "RESOURCE_USAGE":
        features.toolCallCount = observation.data.toolCallCount;
        features.executionTime = observation.data.executionTime;
        features.memoryUsage = observation.data.memoryUsage;
        break;
    }

    return features;
  }

  discoverPatterns(): PatternRecord[] {
    const newPatterns: PatternRecord[] = [];
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.options.measurementWindowDays * 24 * 60 * 60 * 1000);

    const recentObservations = this.observations.filter(o => o.timestamp >= windowStart);

    const byType = new Map<string, Observation[]>();
    for (const obs of recentObservations) {
      if (!byType.has(obs.type)) {
        byType.set(obs.type, []);
      }
      byType.get(obs.type)!.push(obs);
    }

    for (const [type, obsList] of byType) {
      if (obsList.length < this.options.minOccurrences) continue;

      if (type === "FAILURE") {
        const failurePatterns = this.findFailurePatterns(obsList);
        newPatterns.push(...failurePatterns);
      }

      if (type === "TOOL_CALL") {
        const toolPatterns = this.findToolPatterns(obsList);
        newPatterns.push(...toolPatterns);
      }

      if (type === "EVALUATION") {
        const evalPatterns = this.findEvaluationPatterns(obsList);
        newPatterns.push(...evalPatterns);
      }

      if (type === "RESOURCE_USAGE") {
        const resourcePatterns = this.findResourcePatterns(obsList);
        newPatterns.push(...resourcePatterns);
      }
    }

    for (const pattern of newPatterns) {
      const existing = this.patterns.find(p => p.name === pattern.name);
      if (!existing) {
        this.patterns.push(pattern);
      } else {
        existing.occurrenceCount += pattern.occurrenceCount;
        existing.lastObserved = pattern.lastObserved;
        existing.observations.push(...pattern.observations);
        existing.status = "UNDER_INVESTIGATION";
      }
    }

    return newPatterns;
  }

  private findFailurePatterns(observations: Observation[]): PatternRecord[] {
    const patterns: PatternRecord[] = [];
    const byCategory = new Map<string, Observation[]>();

    for (const obs of observations) {
      const category = obs.data.category as string || "UNKNOWN";
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(obs);
    }

    for (const [category, obsList] of byCategory) {
      if (obsList.length >= this.options.minOccurrences) {
        const firstObserved = obsList[0].timestamp;
        const lastObserved = obsList[obsList.length - 1].timestamp;

        patterns.push({
          id: `pattern-failure-${category}-${Date.now()}`,
          name: `Recurring ${category} Failures`,
          category: "ENGINEERING",
          observations: obsList.map(o => o.id),
          firstObserved,
          lastObserved,
          occurrenceCount: obsList.length,
          measurementWindow: { start: firstObserved, end: lastObserved },
          affectedComponents: [...new Set(obsList.map(o => o.taskId))],
          supportingEvidence: [],
          contradictoryEvidence: [],
          candidateExplanations: [
            `Repeated ${category} failures suggest systemic issue`,
            `Possible root cause: inadequate error handling for this category`,
            `May indicate missing validation or contract violation`
          ],
          severity: Math.min(5, Math.ceil(obsList.length / 2)),
          relevance: 4,
          confidence: Math.min(0.9, 0.5 + obsList.length * 0.1),
          status: "HYPOTHESIS",
          nextAction: `Investigate root cause of ${category} failures`,
          verificationMethod: "Add targeted tests and monitoring for this failure category"
        });
      }
    }

    return patterns;
  }

  private findToolPatterns(_observations: Observation[]): PatternRecord[] {
    return [];
  }

  private findEvaluationPatterns(observations: Observation[]): PatternRecord[] {
    const patterns: PatternRecord[] = [];
    const failedEvaluations = observations.filter(o => o.data.verdict === "FAILED" || o.data.verdict === "UNVERIFIED");

    if (failedEvaluations.length >= this.options.minOccurrences) {
      const firstObserved = failedEvaluations[0].timestamp;
      const lastObserved = failedEvaluations[failedEvaluations.length - 1].timestamp;

      patterns.push({
        id: `pattern-eval-failures-${Date.now()}`,
        name: "Recurring Evaluation Failures",
        category: "WORKFLOW",
        observations: failedEvaluations.map(o => o.id),
        firstObserved,
        lastObserved,
        occurrenceCount: failedEvaluations.length,
        measurementWindow: { start: firstObserved, end: lastObserved },
        affectedComponents: [...new Set(failedEvaluations.map(o => o.taskId))],
        supportingEvidence: [],
        contradictoryEvidence: [],
        candidateExplanations: [
          "Evaluation criteria may be too strict or unclear",
          "Implementation may have systematic issues",
          "Evidence collection may be incomplete"
        ],
        severity: 3,
        relevance: 5,
        confidence: 0.7,
        status: "HYPOTHESIS",
        nextAction: "Review evaluation criteria and evidence collection process",
        verificationMethod: "Analyze failed evaluations for common missing evidence"
      });
    }

    return patterns;
  }

  private findResourcePatterns(observations: Observation[]): PatternRecord[] {
    const patterns: PatternRecord[] = [];
    const highUsage = observations.filter(o =>
      (o.data.toolCallCount as number) > 40 ||
      (o.data.executionTime as number) > 240000
    );

    if (highUsage.length >= this.options.minOccurrences) {
      const firstObserved = highUsage[0].timestamp;
      const lastObserved = highUsage[highUsage.length - 1].timestamp;

      patterns.push({
        id: `pattern-resource-exhaustion-${Date.now()}`,
        name: "Recurring Resource Exhaustion",
        category: "PERFORMANCE",
        observations: highUsage.map(o => o.id),
        firstObserved,
        lastObserved,
        occurrenceCount: highUsage.length,
        measurementWindow: { start: firstObserved, end: lastObserved },
        affectedComponents: [...new Set(highUsage.map(o => o.taskId))],
        supportingEvidence: [],
        contradictoryEvidence: [],
        candidateExplanations: [
          "Tasks consistently exceed resource budgets",
          "Possible infinite loops or inefficient algorithms",
          "May need better resource estimation or optimization"
        ],
        severity: 4,
        relevance: 4,
        confidence: 0.8,
        status: "HYPOTHESIS",
        nextAction: "Profile high-resource tasks and optimize",
        verificationMethod: "Measure resource usage before and after optimization"
      });
    }

    return patterns;
  }

  validatePattern(patternId: string, _evidence: Evidence[]): { validated: boolean; confidence: number; notes: string[] } {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (!pattern) {
      return { validated: false, confidence: 0, notes: ["Pattern not found"] };
    }

    const notes: string[] = [];
    let confidence = pattern.confidence;

    if (pattern.occurrenceCount < this.options.minOccurrences) {
      notes.push(`Insufficient occurrences: ${pattern.occurrenceCount} < ${this.options.minOccurrences}`);
      confidence *= 0.5;
    } else {
      notes.push(`Sufficient occurrences: ${pattern.occurrenceCount}`);
    }

    const uniqueTasks = new Set(pattern.affectedComponents);
    if (uniqueTasks.size < 2) {
      notes.push("Observations not independent (same task)");
      confidence *= 0.3;
    } else {
      notes.push(`Independent observations across ${uniqueTasks.size} tasks`);
    }

    if (pattern.contradictoryEvidence.length > 0) {
      notes.push(`Has ${pattern.contradictoryEvidence.length} pieces of counterevidence`);
      confidence *= 0.7;
    } else {
      notes.push("No counterevidence found");
    }

    const timeSpan = pattern.lastObserved.getTime() - pattern.firstObserved.getTime();
    const days = timeSpan / (24 * 60 * 60 * 1000);
    if (days > this.options.measurementWindowDays) {
      notes.push(`Pattern spans ${days.toFixed(1)} days (within window)`);
    } else {
      notes.push(`Pattern spans ${days.toFixed(1)} days`);
    }

    const validated = confidence >= 0.6 && pattern.occurrenceCount >= this.options.minOccurrences;

    if (validated) {
      pattern.status = "VALIDATED";
    } else if (confidence < 0.3) {
      pattern.status = "REJECTED";
    }

    pattern.confidence = confidence;

    return { validated, confidence, notes };
  }

  getPatterns(status?: PatternStatus): PatternRecord[] {
    if (status) {
      return this.patterns.filter(p => p.status === status);
    }
    return [...this.patterns];
  }

  getPattern(id: string): PatternRecord | undefined {
    return this.patterns.find(p => p.id === id);
  }

  analyzeTrends(): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];
    const now = new Date();
    const windows = [7, 14, 30, 60, 90];

    for (const windowDays of windows) {
      const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
      const windowObservations = this.observations.filter(o => o.timestamp >= windowStart);

      const failures = windowObservations.filter(o => o.type === "FAILURE");
      const byCategory = new Map<string, number>();
      for (const f of failures) {
        const cat = f.data.category as string || "UNKNOWN";
        byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
      }

      for (const [category, count] of byCategory) {
        trends.push({
          metric: "failure_frequency",
          category,
          windowDays,
          value: count,
          timestamp: now
        });
      }

      const evaluations = windowObservations.filter(o => o.type === "EVALUATION");
      const successful = evaluations.filter(e => e.data.verdict === "SUCCESS").length;
      if (evaluations.length > 0) {
        trends.push({
          metric: "success_rate",
          category: "overall",
          windowDays,
          value: successful / evaluations.length,
          timestamp: now
        });
      }
    }

    return trends;
  }
}

export interface TrendAnalysis {
  metric: string;
  category: string;
  windowDays: number;
  value: number;
  timestamp: Date;
}

export function createObservationFromTrace(trace: ExecutionTrace): Observation[] {
  const observations: Observation[] = [];
  const now = new Date();

  for (const call of trace.toolCalls || []) {
    observations.push({
      id: `obs-${call.id}`,
      taskId: trace.taskId,
      type: "TOOL_CALL",
      data: {
        toolName: call.toolName,
        status: call.status,
        duration: call.endTime ? call.endTime.getTime() - call.startTime.getTime() : 0
      },
      timestamp: call.startTime,
      tags: ["tool", call.toolName, call.status]
    });
  }

  for (const error of trace.errors || []) {
    observations.push({
      id: `obs-${error.id}`,
      taskId: trace.taskId,
      type: "FAILURE",
      data: {
        category: error.category,
        message: error.message,
        recoverable: error.recoverable
      },
      timestamp: error.timestamp,
      tags: ["failure", error.category]
    });
  }

  const resourceData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(trace.resourceUsage)) {
    resourceData[key] = value;
  }

  observations.push({
    id: `obs-resource-${trace.taskId}`,
    taskId: trace.taskId,
    type: "RESOURCE_USAGE",
    data: resourceData,
    timestamp: trace.endTime || now,
    tags: ["resources"]
  });

  return observations;
}

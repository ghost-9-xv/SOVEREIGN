/**
 * SOVEREIGN Memory System
 * Persistent memory with provenance tracking (Part 15)
 */

import {
  MemoryRecord,
  MemoryCategory
} from "./types.js";

export interface MemoryOptions {
  maxMemoriesPerCategory?: number;
  retentionDays?: number;
  autoValidate?: boolean;
}

export class MemorySystem {
  private memories = new Map<string, MemoryRecord[]>();
  private options: Required<MemoryOptions>;
  private memoryCounter = 0;

  constructor(options: MemoryOptions = {}) {
    this.options = {
      maxMemoriesPerCategory: options.maxMemoriesPerCategory ?? 1000,
      retentionDays: options.retentionDays ?? 365,
      autoValidate: options.autoValidate ?? false
    };

    const categories: string[] = [
      "SEMANTIC", "EPISODIC", "PROCEDURAL", "DECISION",
      "EXPERIMENTAL", "PREFERENCE", "PROJECT", "EXPERTISE", "PATTERN"
    ];
    for (const category of categories) {
      this.memories.set(category, []);
    }
  }

  store(memory: Omit<MemoryRecord, "id" | "timestamp">): MemoryRecord {
    const record: MemoryRecord = {
      ...memory,
      id: `mem-${Date.now()}-${++this.memoryCounter}`,
      timestamp: new Date()
    };

    const categoryMemories = this.memories.get(memory.category) || [];
    categoryMemories.push(record);

    if (categoryMemories.length > this.options.maxMemoriesPerCategory) {
      categoryMemories.shift();
    }

    this.memories.set(memory.category, categoryMemories);
    return record;
  }

  get(category: MemoryCategory, filters?: {
    tags?: string[];
    since?: Date;
    validationStatus?: MemoryRecord["validationStatus"];
    limit?: number;
  }): MemoryRecord[] {
    let results = this.memories.get(category) || [];

    if (filters) {
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(m => filters.tags!.some(t => m.tags.includes(t)));
      }
      if (filters.since) {
        results = results.filter(m => m.timestamp >= filters.since!);
      }
      if (filters.validationStatus) {
        results = results.filter(m => m.validationStatus === filters.validationStatus);
      }
      if (filters.limit) {
        results = results.slice(-filters.limit);
      }
    }

    return [...results].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getAll(filters?: {
    tags?: string[];
    since?: Date;
    validationStatus?: MemoryRecord["validationStatus"];
    limit?: number;
  }): MemoryRecord[] {
    let results: MemoryRecord[] = [];
    for (const memories of this.memories.values()) {
      results.push(...memories);
    }

    if (filters) {
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(m => filters.tags!.some(t => m.tags.includes(t)));
      }
      if (filters.since) {
        results = results.filter(m => m.timestamp >= filters.since!);
      }
      if (filters.validationStatus) {
        results = results.filter(m => m.validationStatus === filters.validationStatus);
      }
      if (filters.limit) {
        results = results.slice(-filters.limit);
      }
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  update(id: string, updates: Partial<MemoryRecord>): boolean {
    for (const memories of this.memories.values()) {
      const index = memories.findIndex(m => m.id === id);
      if (index !== -1) {
        memories[index] = { ...memories[index], ...updates };
        return true;
      }
    }
    return false;
  }

  delete(id: string): boolean {
    for (const memories of this.memories.values()) {
      const index = memories.findIndex(m => m.id === id);
      if (index !== -1) {
        memories.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  detectConflicts(): ConflictReport[] {
    const conflicts: ConflictReport[] = [];
    const allMemories = this.getAll();

    const byContent = new Map<string, MemoryRecord[]>();
    for (const mem of allMemories) {
      const key = mem.content.substring(0, 100);
      if (!byContent.has(key)) {
        byContent.set(key, []);
      }
      byContent.get(key)!.push(mem);
    }

    for (const [, memories] of byContent) {
      if (memories.length > 1) {
        const statuses = new Set(memories.map(m => m.validationStatus));
        if (statuses.size > 1) {
          conflicts.push({
            type: "VALIDATION_CONFLICT",
            memories: memories.map(m => m.id),
            description: `Memories with same content have different validation statuses: ${Array.from(statuses).join(", ")}`,
            severity: "HIGH"
          });
        }

        const stale = memories.filter(m =>
          m.validationStatus === "VALIDATED" &&
          m.revalidationConditions && m.revalidationConditions.length > 0
        );
        if (stale.length > 0) {
          conflicts.push({
            type: "STALE_MEMORY",
            memories: stale.map(m => m.id),
            description: `Validated memories have revalidation conditions`,
            severity: "MEDIUM"
          });
        }
      }
    }

    return conflicts;
  }

  resolveConflict(_conflict: ConflictReport, _resolution: "KEEP_LATEST" | "KEEP_HIGHEST_CONFIDENCE" | "MERGE" | "MANUAL"): boolean {
    return true;
  }

  compoundKnowledge(): CompoundedKnowledge[] {
    const compounded: CompoundedKnowledge[] = [];

    const procedural = this.get("PROCEDURAL", { validationStatus: "VALIDATED" });
    for (const proc of procedural) {
      if (proc.tags.includes("workflow") && proc.confidence > 0.8) {
        compounded.push({
          sourceMemoryIds: [proc.id],
          type: "WORKFLOW_TEMPLATE",
          content: `Workflow template derived from: ${proc.content}`,
          confidence: proc.confidence,
          proposedAction: "Create reusable workflow from validated procedure"
        });
      }
    }

    const experimental = this.get("EXPERIMENTAL", { validationStatus: "VALIDATED" });
    const byHypothesis = new Map<string, MemoryRecord[]>();
    for (const exp of experimental) {
      const hypothesis = exp.tags.find(t => t.startsWith("hypothesis:")) || "unknown";
      if (!byHypothesis.has(hypothesis)) {
        byHypothesis.set(hypothesis, []);
      }
      byHypothesis.get(hypothesis)!.push(exp);
    }

    for (const [hypothesis, memories] of byHypothesis) {
      if (memories.length >= 3) {
        const supported = memories.filter(m => m.content.includes("supported")).length;
        if (supported / memories.length > 0.7) {
          compounded.push({
            sourceMemoryIds: memories.map(m => m.id),
            type: "VALIDATED_PRINCIPLE",
            content: `Principle validated: ${hypothesis}`,
            confidence: supported / memories.length,
            proposedAction: "Add to expertise memory for future task routing"
          });
        }
      }
    }

    return compounded;
  }

  exportMemory(category?: MemoryCategory): string {
    const data = category ? this.get(category) : this.getAll();
    return JSON.stringify(data, null, 2);
  }

  importMemory(json: string): number {
    const data = JSON.parse(json) as MemoryRecord[];
    let count = 0;
    for (const record of data) {
      if (record.id && record.category && record.content) {
        const existing = this.getAll().find(m => m.id === record.id);
        if (!existing) {
          const catMemories = this.memories.get(record.category) || [];
          catMemories.push(record);
          this.memories.set(record.category, catMemories);
          count++;
        }
      }
    }
    return count;
  }

  getStats(): MemoryStats {
    const stats: MemoryStats = {
      totalMemories: 0,
      byCategory: {},
      byValidationStatus: {},
      oldestMemory: null,
      newestMemory: null
    };

    let oldest: Date | null = null;
    let newest: Date | null = null;

    for (const [category, memories] of this.memories) {
      stats.byCategory[category] = memories.length;
      stats.totalMemories += memories.length;

      for (const mem of memories) {
        if (!oldest || mem.timestamp < oldest) oldest = mem.timestamp;
        if (!newest || mem.timestamp > newest) newest = mem.timestamp;

        stats.byValidationStatus[mem.validationStatus] =
          (stats.byValidationStatus[mem.validationStatus] || 0) + 1;
      }
    }

    stats.oldestMemory = oldest;
    stats.newestMemory = newest;

    return stats;
  }
}

export interface ConflictReport {
  type: "VALIDATION_CONFLICT" | "STALE_MEMORY" | "CONTRADICTORY_CONTENT" | "DUPLICATE";
  memories: string[];
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface CompoundedKnowledge {
  sourceMemoryIds: string[];
  type: "WORKFLOW_TEMPLATE" | "VALIDATED_PRINCIPLE" | "ROUTING_RULE" | "CHECKLIST_ITEM";
  content: string;
  confidence: number;
  proposedAction: string;
}

export interface MemoryStats {
  totalMemories: number;
  byCategory: Record<string, number>;
  byValidationStatus: Record<string, number>;
  oldestMemory: Date | null;
  newestMemory: Date | null;
}
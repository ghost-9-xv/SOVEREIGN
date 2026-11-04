/**
 * SOVEREIGN Memory System
 * Persistent memory with provenance tracking (Part 15)
 */
import { MemoryRecord, MemoryCategory } from "./types.js";
export interface MemoryOptions {
    maxMemoriesPerCategory?: number;
    retentionDays?: number;
    autoValidate?: boolean;
}
export declare class MemorySystem {
    private memories;
    private options;
    private memoryCounter;
    constructor(options?: MemoryOptions);
    store(memory: Omit<MemoryRecord, "id" | "timestamp">): MemoryRecord;
    get(category: MemoryCategory, filters?: {
        tags?: string[];
        since?: Date;
        validationStatus?: MemoryRecord["validationStatus"];
        limit?: number;
    }): MemoryRecord[];
    getAll(filters?: {
        tags?: string[];
        since?: Date;
        validationStatus?: MemoryRecord["validationStatus"];
        limit?: number;
    }): MemoryRecord[];
    update(id: string, updates: Partial<MemoryRecord>): boolean;
    delete(id: string): boolean;
    detectConflicts(): ConflictReport[];
    resolveConflict(_conflict: ConflictReport, _resolution: "KEEP_LATEST" | "KEEP_HIGHEST_CONFIDENCE" | "MERGE" | "MANUAL"): boolean;
    compoundKnowledge(): CompoundedKnowledge[];
    exportMemory(category?: MemoryCategory): string;
    importMemory(json: string): number;
    getStats(): MemoryStats;
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
//# sourceMappingURL=memory.d.ts.map
/**
 * SOVEREIGN Task Manager
 * Manages task lifecycle, state transitions, and execution tracking
 */
import { DEFAULT_RESOURCE_BUDGET, isTerminalState } from "./types.js";
function mergeBudget(base, overrides) {
    return {
        maxRepairIterations: overrides.maxRepairIterations ?? base.maxRepairIterations,
        timeBudgetMs: overrides.timeBudgetMs ?? base.timeBudgetMs,
        costBudgetUsd: overrides.costBudgetUsd ?? base.costBudgetUsd,
        toolCallLimit: overrides.toolCallLimit ?? base.toolCallLimit,
        modelCallLimit: overrides.modelCallLimit ?? base.modelCallLimit,
        memoryLimitMb: overrides.memoryLimitMb ?? base.memoryLimitMb,
        escalationTriggers: overrides.escalationTriggers ?? base.escalationTriggers
    };
}
function cloneBudget(budget) {
    return {
        maxRepairIterations: budget.maxRepairIterations,
        timeBudgetMs: budget.timeBudgetMs,
        costBudgetUsd: budget.costBudgetUsd,
        toolCallLimit: budget.toolCallLimit,
        modelCallLimit: budget.modelCallLimit,
        memoryLimitMb: budget.memoryLimitMb,
        escalationTriggers: budget.escalationTriggers
    };
}
export class TaskManager {
    tasks = new Map();
    options;
    taskCounter = 0;
    constructor(options = {}) {
        this.options = {
            defaultBudget: mergeBudget(DEFAULT_RESOURCE_BUDGET, options.defaultBudget || {}),
            maxConcurrentTasks: options.maxConcurrentTasks ?? 10
        };
    }
    createTask(objective, requirements = [], parentTaskId) {
        const id = `task-${Date.now()}-${++this.taskCounter}`;
        const now = new Date();
        const task = {
            id,
            objective,
            requirements,
            state: "REQUESTED",
            createdAt: now,
            updatedAt: now,
            budget: cloneBudget(this.options.defaultBudget),
            childTaskIds: [],
            parentTaskId
        };
        if (parentTaskId) {
            const parent = this.tasks.get(parentTaskId);
            if (parent) {
                parent.childTaskIds.push(id);
                parent.updatedAt = now;
            }
        }
        this.tasks.set(id, task);
        return task;
    }
    getTask(id) {
        return this.tasks.get(id);
    }
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    getTasksByState(state) {
        return Array.from(this.tasks.values()).filter(t => t.state === state);
    }
    transitionState(taskId, newState) {
        const task = this.tasks.get(taskId);
        if (!task)
            return false;
        if (!this.isValidTransition(task.state, newState)) {
            throw new Error(`Invalid state transition from ${task.state} to ${newState}`);
        }
        task.state = newState;
        task.updatedAt = new Date();
        if (newState === "IN_PROGRESS" && !task.startedAt) {
            task.startedAt = new Date();
            task.trace = this.createEmptyTrace(taskId);
        }
        if (isTerminalState(newState)) {
            task.completedAt = new Date();
        }
        return true;
    }
    isValidTransition(from, to) {
        if (isTerminalState(from))
            return false;
        const validTransitions = {
            REQUESTED: ["ANALYZED", "BLOCKED", "FAILED"],
            ANALYZED: ["PLANNED", "BLOCKED", "FAILED"],
            PLANNED: ["IN_PROGRESS", "BLOCKED", "FAILED"],
            IN_PROGRESS: ["EXECUTED", "EVALUATING", "REPAIR_REQUIRED", "BLOCKED", "FAILED"],
            EXECUTED: ["EVALUATING", "REPAIR_REQUIRED", "PARTIALLY_COMPLETE", "FAILED"],
            EVALUATING: ["VERIFIED", "REPAIR_REQUIRED", "PARTIALLY_COMPLETE", "FAILED", "UNVERIFIED"],
            REPAIR_REQUIRED: ["IN_PROGRESS", "BLOCKED", "FAILED"],
            PARTIALLY_COMPLETE: ["VERIFIED", "REPAIR_REQUIRED", "FAILED"],
            VERIFIED: ["ACCEPTED", "REPAIR_REQUIRED"],
            ACCEPTED: [],
            BLOCKED: ["REQUESTED", "ANALYZED"],
            FAILED: ["REQUESTED", "ANALYZED"],
            UNVERIFIED: ["EVALUATING", "REPAIR_REQUIRED", "FAILED"]
        };
        return validTransitions[from]?.includes(to) ?? false;
    }
    createEmptyTrace(taskId) {
        return {
            taskId,
            startTime: new Date(),
            state: "IN_PROGRESS",
            toolCalls: [],
            generatedArtifacts: [],
            errors: [],
            resourceUsage: {
                toolCallCount: 0,
                modelCallCount: 0,
                totalExecutionTimeMs: 0,
                peakMemoryMb: 0,
                totalCostUsd: 0
            }
        };
    }
    recordToolCall(taskId, toolCall) {
        const task = this.tasks.get(taskId);
        if (!task || !task.trace)
            return false;
        task.trace.toolCalls.push(toolCall);
        task.trace.resourceUsage.toolCallCount++;
        task.updatedAt = new Date();
        return true;
    }
    recordArtifact(taskId, artifact) {
        const task = this.tasks.get(taskId);
        if (!task || !task.trace)
            return false;
        task.trace.generatedArtifacts.push(artifact);
        task.updatedAt = new Date();
        return true;
    }
    recordError(taskId, error) {
        const task = this.tasks.get(taskId);
        if (!task || !task.trace)
            return false;
        task.trace.errors.push(error);
        task.updatedAt = new Date();
        return true;
    }
    updateResourceUsage(taskId, usage) {
        const task = this.tasks.get(taskId);
        if (!task || !task.trace)
            return false;
        task.trace.resourceUsage = {
            ...task.trace.resourceUsage,
            ...usage
        };
        task.updatedAt = new Date();
        return true;
    }
    checkBudget(taskId) {
        const task = this.tasks.get(taskId);
        if (!task || !task.trace)
            return { exceeded: false, violations: [] };
        const usage = task.trace.resourceUsage;
        const budget = task.budget;
        const violations = [];
        if (usage.toolCallCount > budget.toolCallLimit) {
            violations.push(`Tool call limit exceeded: ${usage.toolCallCount} > ${budget.toolCallLimit}`);
        }
        if (usage.modelCallCount > budget.modelCallLimit) {
            violations.push(`Model call limit exceeded: ${usage.modelCallCount} > ${budget.modelCallLimit}`);
        }
        if (usage.totalExecutionTimeMs > budget.timeBudgetMs) {
            violations.push(`Time budget exceeded: ${usage.totalExecutionTimeMs}ms > ${budget.timeBudgetMs}ms`);
        }
        if (usage.totalCostUsd > budget.costBudgetUsd) {
            violations.push(`Cost budget exceeded: $${usage.totalCostUsd} > $${budget.costBudgetUsd}`);
        }
        if (usage.peakMemoryMb > budget.memoryLimitMb) {
            violations.push(`Memory limit exceeded: ${usage.peakMemoryMb}MB > ${budget.memoryLimitMb}MB`);
        }
        return { exceeded: violations.length > 0, violations };
    }
    completeTask(taskId, success) {
        const task = this.tasks.get(taskId);
        if (!task)
            return false;
        task.trace.endTime = new Date();
        task.trace.state = success ? "VERIFIED" : "FAILED";
        task.updatedAt = new Date();
        this.transitionState(taskId, success ? "VERIFIED" : "FAILED");
        return true;
    }
    deleteTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return false;
        if (task.childTaskIds.length > 0) {
            throw new Error(`Cannot delete task with children: ${taskId}`);
        }
        if (task.parentTaskId) {
            const parent = this.tasks.get(task.parentTaskId);
            if (parent) {
                parent.childTaskIds = parent.childTaskIds.filter(id => id !== taskId);
            }
        }
        this.tasks.delete(taskId);
        return true;
    }
}
//# sourceMappingURL=task-manager.js.map
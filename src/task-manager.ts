/**
 * SOVEREIGN Task Manager
 * Manages task lifecycle, state transitions, and execution tracking
 */

import {
  TaskState,
  Requirement,
  ExecutionTrace,
  ToolCall,
  Artifact,
  ExecutionError,
  ResourceUsage,
  ResourceBudget,
  DEFAULT_RESOURCE_BUDGET,
  isTerminalState
} from "./types.js";

export interface Task {
  id: string;
  objective: string;
  requirements: Requirement[];
  state: TaskState;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  trace?: ExecutionTrace;
  budget: ResourceBudget;
  expertiseSpecificationId?: string;
  parentTaskId?: string;
  childTaskIds: string[];
}

export interface TaskManagerOptions {
  defaultBudget?: Partial<ResourceBudget>;
  maxConcurrentTasks?: number;
}

interface TaskManagerOptionsInternal {
  defaultBudget: ResourceBudget;
  maxConcurrentTasks: number;
}

function mergeBudget(base: ResourceBudget, overrides: Partial<ResourceBudget>): ResourceBudget {
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

function cloneBudget(budget: ResourceBudget): ResourceBudget {
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
  private tasks = new Map<string, Task>();
  private options: TaskManagerOptionsInternal;
  private taskCounter = 0;

  constructor(options: TaskManagerOptions = {}) {
    this.options = {
      defaultBudget: mergeBudget(DEFAULT_RESOURCE_BUDGET, options.defaultBudget || {}),
      maxConcurrentTasks: options.maxConcurrentTasks ?? 10
    };
  }

  createTask(objective: string, requirements: Requirement[] = [], parentTaskId?: string): Task {
    const id = `task-${Date.now()}-${++this.taskCounter}`;
    const now = new Date();

    const task: Task = {
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

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByState(state: TaskState): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.state === state);
  }

  transitionState(taskId: string, newState: TaskState): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

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

  private isValidTransition(from: TaskState, to: TaskState): boolean {
    if (isTerminalState(from)) return false;

    const validTransitions: Record<TaskState, TaskState[]> = {
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

  private createEmptyTrace(taskId: string): ExecutionTrace {
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

  recordToolCall(taskId: string, toolCall: ToolCall): boolean {
    const task = this.tasks.get(taskId);
    if (!task || !task.trace) return false;

    task.trace.toolCalls.push(toolCall);
    task.trace.resourceUsage.toolCallCount++;
    task.updatedAt = new Date();
    return true;
  }

  recordArtifact(taskId: string, artifact: Artifact): boolean {
    const task = this.tasks.get(taskId);
    if (!task || !task.trace) return false;

    task.trace.generatedArtifacts.push(artifact);
    task.updatedAt = new Date();
    return true;
  }

  recordError(taskId: string, error: ExecutionError): boolean {
    const task = this.tasks.get(taskId);
    if (!task || !task.trace) return false;

    task.trace.errors.push(error);
    task.updatedAt = new Date();
    return true;
  }

  updateResourceUsage(taskId: string, usage: Partial<ResourceUsage>): boolean {
    const task = this.tasks.get(taskId);
    if (!task || !task.trace) return false;

    task.trace.resourceUsage = {
      ...task.trace.resourceUsage,
      ...usage
    };
    task.updatedAt = new Date();
    return true;
  }

  checkBudget(taskId: string): { exceeded: boolean; violations: string[] } {
    const task = this.tasks.get(taskId);
    if (!task || !task.trace) return { exceeded: false, violations: [] };

    const usage = task.trace.resourceUsage;
    const budget = task.budget;
    const violations: string[] = [];

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

  completeTask(taskId: string, success: boolean): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.trace!.endTime = new Date();
    task.trace!.state = success ? "VERIFIED" : "FAILED";
    task.updatedAt = new Date();

    this.transitionState(taskId, success ? "VERIFIED" : "FAILED");
    return true;
  }

  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

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

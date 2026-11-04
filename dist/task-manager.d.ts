/**
 * SOVEREIGN Task Manager
 * Manages task lifecycle, state transitions, and execution tracking
 */
import { TaskState, Requirement, ExecutionTrace, ToolCall, Artifact, ExecutionError, ResourceUsage, ResourceBudget } from "./types.js";
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
export declare class TaskManager {
    private tasks;
    private options;
    private taskCounter;
    constructor(options?: TaskManagerOptions);
    createTask(objective: string, requirements?: Requirement[], parentTaskId?: string): Task;
    getTask(id: string): Task | undefined;
    getAllTasks(): Task[];
    getTasksByState(state: TaskState): Task[];
    transitionState(taskId: string, newState: TaskState): boolean;
    private isValidTransition;
    private createEmptyTrace;
    recordToolCall(taskId: string, toolCall: ToolCall): boolean;
    recordArtifact(taskId: string, artifact: Artifact): boolean;
    recordError(taskId: string, error: ExecutionError): boolean;
    updateResourceUsage(taskId: string, usage: Partial<ResourceUsage>): boolean;
    checkBudget(taskId: string): {
        exceeded: boolean;
        violations: string[];
    };
    completeTask(taskId: string, success: boolean): boolean;
    deleteTask(taskId: string): boolean;
}
//# sourceMappingURL=task-manager.d.ts.map
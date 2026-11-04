/**
 * SOVEREIGN Execution Engine
 * Core execution logic with tool contracts, permissions, and evidence collection
 */
import { ToolContract, ExecutionTrace, Permission, AuthorizationRequest, Evidence, EvidenceType } from "./types.js";
import { TaskManager, Task } from "./task-manager.js";
export interface ToolExecutor {
    execute(toolName: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>>;
}
export interface AuthorizationManager {
    requestAuthorization(request: AuthorizationRequest): Promise<boolean>;
    checkPermission(permission: Permission): boolean;
}
export interface EvidenceCollector {
    collect(evidence: Evidence): void;
    getEvidence(taskId?: string): Evidence[];
    getEvidenceByType(type: EvidenceType): Evidence[];
}
export declare class DefaultEvidenceCollector implements EvidenceCollector {
    private evidence;
    collect(evidence: Evidence): void;
    getEvidence(taskId?: string): Evidence[];
    getEvidenceByType(type: EvidenceType): Evidence[];
}
export declare class InMemoryAuthorizationManager implements AuthorizationManager {
    private grantedPermissions;
    private pendingRequests;
    constructor(initialPermissions?: Permission[]);
    grantPermission(permission: Permission): void;
    revokePermission(permission: Permission): void;
    checkPermission(permission: Permission): boolean;
    requestAuthorization(request: AuthorizationRequest): Promise<boolean>;
    getPendingRequests(): AuthorizationRequest[];
}
export declare class DefaultToolExecutor implements ToolExecutor {
    private tools;
    registerTool(contract: ToolContract, handler: (inputs: Record<string, unknown>) => Promise<Record<string, unknown>>): void;
    getToolContract(name: string): ToolContract | undefined;
    execute(toolName: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>>;
    listTools(): string[];
}
export interface ExecutionEngineOptions {
    toolExecutor: ToolExecutor;
    authorizationManager: AuthorizationManager;
    evidenceCollector: EvidenceCollector;
    taskManager: TaskManager;
}
export declare class ExecutionEngine {
    private options;
    constructor(options: ExecutionEngineOptions);
    executeTask(task: Task): Promise<ExecutionTrace>;
    executeToolCall(taskId: string, toolName: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>>;
    checkAuthorization(permissions: Permission[]): Promise<boolean>;
}
//# sourceMappingURL=execution-engine.d.ts.map
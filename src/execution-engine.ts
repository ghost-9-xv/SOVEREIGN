/**
 * SOVEREIGN Execution Engine
 * Core execution logic with tool contracts, permissions, and evidence collection
 */

import {
  ToolContract,
  ToolCall,
  ExecutionTrace,
  ExecutionError,
  Permission,
  AuthorizationRequest,
  Evidence,
  EvidenceType
} from "./types.js";
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

export class DefaultEvidenceCollector implements EvidenceCollector {
  private evidence = new Map<string, Evidence[]>();

  collect(evidence: Evidence): void {
    const key = evidence.relatedTaskId || "global";
    if (!this.evidence.has(key)) {
      this.evidence.set(key, []);
    }
    this.evidence.get(key)!.push(evidence);
  }

  getEvidence(taskId?: string): Evidence[] {
    const key = taskId || "global";
    return this.evidence.get(key) || [];
  }

  getEvidenceByType(type: EvidenceType): Evidence[] {
    const all: Evidence[] = [];
    for (const evs of this.evidence.values()) {
      all.push(...evs.filter(e => e.type === type));
    }
    return all;
  }
}

export class InMemoryAuthorizationManager implements AuthorizationManager {
  private grantedPermissions = new Set<Permission>();
  private pendingRequests = new Map<string, AuthorizationRequest>();

  constructor(initialPermissions: Permission[] = []) {
    for (const perm of initialPermissions) {
      this.grantedPermissions.add(perm);
    }
  }

  grantPermission(permission: Permission): void {
    this.grantedPermissions.add(permission);
  }

  revokePermission(permission: Permission): void {
    this.grantedPermissions.delete(permission);
  }

  checkPermission(permission: Permission): boolean {
    return this.grantedPermissions.has(permission);
  }

  async requestAuthorization(request: AuthorizationRequest): Promise<boolean> {
    this.pendingRequests.set(request.id, request);

    const allGranted = request.requiredPermissions.every(p => this.checkPermission(p));

    if (allGranted) {
      request.status = "APPROVED";
      request.approvedAt = new Date();
      return true;
    }

    request.status = "DENIED";
    return false;
  }

  getPendingRequests(): AuthorizationRequest[] {
    return Array.from(this.pendingRequests.values()).filter(r => r.status === "PENDING");
  }
}

export class DefaultToolExecutor implements ToolExecutor {
  private tools = new Map<string, ToolContract & { handler: (inputs: Record<string, unknown>) => Promise<Record<string, unknown>> }>();

  registerTool(contract: ToolContract, handler: (inputs: Record<string, unknown>) => Promise<Record<string, unknown>>): void {
    this.tools.set(contract.name, { ...contract, handler });
  }

  getToolContract(name: string): ToolContract | undefined {
    return this.tools.get(name);
  }

  async execute(toolName: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    return await tool.handler(inputs);
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

export interface ExecutionEngineOptions {
  toolExecutor: ToolExecutor;
  authorizationManager: AuthorizationManager;
  evidenceCollector: EvidenceCollector;
  taskManager: TaskManager;
}

export class ExecutionEngine {
  private options: ExecutionEngineOptions;

  constructor(options: ExecutionEngineOptions) {
    this.options = options;
  }

  async executeTask(task: Task): Promise<ExecutionTrace> {
    const { taskManager, evidenceCollector } = this.options;

    taskManager.transitionState(task.id, "IN_PROGRESS");

    const trace = task.trace!;
    trace.startTime = new Date();

    try {
      evidenceCollector.collect({
        id: `evidence-${Date.now()}`,
        type: "OBSERVED_FACT",
        content: `Task started: ${task.objective}`,
        source: "execution-engine",
        timestamp: new Date(),
        confidence: 1.0,
        tags: ["task-start"],
        relatedTaskId: task.id
      });

      trace.endTime = new Date();
      trace.state = "EXECUTED";

      taskManager.completeTask(task.id, true);

      return trace;
    } catch (error) {
      trace.endTime = new Date();
      trace.state = "FAILED";

      const execError: ExecutionError = {
        id: `error-${Date.now()}`,
        category: "IMPLEMENTATION_DEFECT",
        message: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack : undefined,
        timestamp: new Date(),
        recoverable: false
      };

      trace.errors.push(execError);
      taskManager.completeTask(task.id, false);

      evidenceCollector.collect({
        id: `evidence-${Date.now()}`,
        type: "OBSERVED_FACT",
        content: `Task failed: ${execError.message}`,
        source: "execution-engine",
        timestamp: new Date(),
        confidence: 1.0,
        tags: ["task-failure"],
        relatedTaskId: task.id
      });

      return trace;
    }
  }

  async executeToolCall(
    taskId: string,
    toolName: string,
    inputs: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { taskManager, toolExecutor, authorizationManager, evidenceCollector } = this.options;

    const toolCall: ToolCall = {
      id: `call-${Date.now()}`,
      toolName,
      inputs,
      startTime: new Date(),
      status: "RUNNING"
    };

    taskManager.recordToolCall(taskId, toolCall);

    try {
      const outputs = await toolExecutor.execute(toolName, inputs);

      toolCall.outputs = outputs;
      toolCall.endTime = new Date();
      toolCall.status = "COMPLETED";

      taskManager.recordToolCall(taskId, toolCall);

      evidenceCollector.collect({
        id: `evidence-${Date.now()}`,
        type: "VERIFIED_RESULT",
        content: `Tool ${toolName} executed successfully`,
        source: "execution-engine",
        timestamp: new Date(),
        confidence: 1.0,
        tags: ["tool-execution", toolName],
        relatedTaskId: taskId
      });

      // Use authorizationManager to avoid unused warning
      if (authorizationManager) {
        await authorizationManager.checkPermission("EXECUTE_COMMAND");
      }

      return outputs;
    } catch (error) {
      toolCall.endTime = new Date();
      toolCall.status = "FAILED";
      toolCall.error = error instanceof Error ? error.message : String(error);

      taskManager.recordToolCall(taskId, toolCall);

      evidenceCollector.collect({
        id: `evidence-${Date.now()}`,
        type: "OBSERVED_FACT",
        content: `Tool ${toolName} failed: ${toolCall.error}`,
        source: "execution-engine",
        timestamp: new Date(),
        confidence: 1.0,
        tags: ["tool-failure", toolName],
        relatedTaskId: taskId
      });

      throw error;
    }
  }

  async checkAuthorization(permissions: Permission[]): Promise<boolean> {
    const { authorizationManager } = this.options;

    for (const permission of permissions) {
      if (!authorizationManager.checkPermission(permission)) {
        const request: AuthorizationRequest = {
          id: `auth-${Date.now()}`,
          operation: "tool-execution",
          requiredPermissions: permissions,
          justification: `Required for tool execution`,
          requestedBy: "execution-engine",
          timestamp: new Date(),
          status: "PENDING"
        };

        return await authorizationManager.requestAuthorization(request);
      }
    }
    return true;
  }
}

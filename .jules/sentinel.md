## 2025-05-15 - Tool Permission Enforcement in Execution Engine
**Vulnerability:** ExecutionEngine executed registered tools directly without verifying tool contract permissions against AuthorizationManager, allowing unauthorized tool calls even when permissions were missing.
**Learning:** Having an authorization manager is ineffective if execution paths bypass authorization checks prior to dispatching actions.
**Prevention:** Always validate and enforce required permissions from contracts/specifications immediately before executing tools or actions.

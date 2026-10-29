"""Core task state models, objective structures, tool contracts, and execution state management."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
import time


class TaskState(Enum):
    REQUESTED = "REQUESTED"
    ANALYZED = "ANALYZED"
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    EXECUTED = "EXECUTED"
    EVALUATING = "EVALUATING"
    REPAIR_REQUIRED = "REPAIR_REQUIRED"
    PARTIALLY_COMPLETE = "PARTIALLY_COMPLETE"
    VERIFIED = "VERIFIED"
    ACCEPTED = "ACCEPTED"
    BLOCKED = "BLOCKED"
    FAILED = "FAILED"
    UNVERIFIED = "UNVERIFIED"


@dataclass
class AcceptanceCriterion:
    criterion_id: str
    description: str
    mandatory: bool = True
    verified: bool = False
    verification_method: Optional[str] = None
    evidence: Optional[str] = None


@dataclass
class Subtask:
    subtask_id: str
    objective: str
    parent_objective_id: str
    inputs: Dict[str, Any] = field(default_factory=dict)
    expected_outputs: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)
    acceptance_criteria: List[AcceptanceCriterion] = field(default_factory=list)
    state: TaskState = TaskState.REQUESTED
    assigned_expertise: List[str] = field(default_factory=list)


@dataclass
class Objective:
    objective_id: str
    title: str
    description: str
    mandatory_requirements: List[str] = field(default_factory=list)
    optional_improvements: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)
    acceptance_criteria: List[AcceptanceCriterion] = field(default_factory=list)
    subtasks: List[Subtask] = field(default_factory=list)
    state: TaskState = TaskState.REQUESTED

    def decompose(self, subtasks: List[Subtask]) -> None:
        """Decompose objective into subtasks."""
        self.subtasks = subtasks
        self.state = TaskState.PLANNED


@dataclass
class ToolContract:
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    required_permissions: List[str] = field(default_factory=list)
    handler: Optional[Callable[..., Any]] = None
    _cached_required: Optional[set] = field(default=None, init=False, repr=False)

    def validate_inputs(self, kwargs: Dict[str, Any]) -> bool:
        """Simple deterministic validation against input schema fields."""
        if self._cached_required is None:
            self._cached_required = set(self.input_schema.get("required", []))
        return self._cached_required.issubset(kwargs)


@dataclass
class ToolExecutionResult:
    tool_name: str
    success: bool
    result: Any
    error: Optional[str] = None
    execution_time_seconds: float = 0.0
    timestamp: float = field(default_factory=time.time)


class ExecutionContext:
    def __init__(self, objective: Objective, permissions: Optional[List[str]] = None):
        self.objective = objective
        self.permissions: List[str] = permissions or []
        self.tool_contracts: Dict[str, ToolContract] = {}
        self.execution_trace: List[ToolExecutionResult] = []
        self.resource_budget: Dict[str, float] = {"max_tool_calls": 50, "max_repairs": 3}
        self.tool_call_count: int = 0
        self.repair_count: int = 0

    def register_tool(self, contract: ToolContract) -> None:
        self.tool_contracts[contract.name] = contract

    def execute_tool(self, tool_name: str, **kwargs) -> ToolExecutionResult:
        if self.tool_call_count >= self.resource_budget.get("max_tool_calls", 50):
            res = ToolExecutionResult(tool_name=tool_name, success=False, result=None, error="Resource exhaustion: Tool call limit reached")
            self.execution_trace.append(res)
            return res

        contract = self.tool_contracts.get(tool_name)
        if not contract:
            res = ToolExecutionResult(tool_name=tool_name, success=False, result=None, error=f"Tool '{tool_name}' not registered")
            self.execution_trace.append(res)
            return res

        # Permission check
        for perm in contract.required_permissions:
            if perm not in self.permissions:
                res = ToolExecutionResult(tool_name=tool_name, success=False, result=None, error=f"Permission denied: Missing permission '{perm}'")
                self.execution_trace.append(res)
                return res

        # Input validation
        if not contract.validate_inputs(kwargs):
            res = ToolExecutionResult(tool_name=tool_name, success=False, result=None, error="Input validation failed")
            self.execution_trace.append(res)
            return res

        start_time = time.time()
        try:
            self.tool_call_count += 1
            output = contract.handler(**kwargs) if contract.handler else None
            res = ToolExecutionResult(tool_name=tool_name, success=True, result=output, execution_time_seconds=time.time() - start_time)
        except Exception as e:
            res = ToolExecutionResult(tool_name=tool_name, success=False, result=None, error=str(e), execution_time_seconds=time.time() - start_time)

        self.execution_trace.append(res)
        return res


# =====================================================================
# ADDITIONS: PRSE MULTI-PHASE ENGINEERING PIPELINE MODELS
# =====================================================================

class GoverningPhase(Enum):
    UNDERSTAND = "UNDERSTAND"
    RESEARCH = "RESEARCH"
    DECOMPOSE = "DECOMPOSE"
    SELECT_EXPERTISE = "SELECT_EXPERTISE"
    PLAN = "PLAN"
    EXECUTE = "EXECUTE"
    OBSERVE = "OBSERVE"
    CLASSIFY = "CLASSIFY"
    ANALYZE_PATTERNS = "ANALYZE_PATTERNS"
    EVALUATE = "EVALUATE"
    DIAGNOSE = "DIAGNOSE"
    REPAIR = "REPAIR"
    RETEST = "RETEST"
    VERIFY = "VERIFY"
    RECORD = "RECORD"
    LEARN = "LEARN"
    IMPROVE = "IMPROVE"


@dataclass
class PhaseResult:
    phase: GoverningPhase
    success: bool
    summary: str
    artifacts: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


@dataclass
class EngineeringOptimizationModel:
    """Conceptual optimization model heuristic: (Verified Value * Reliability * Adaptability) / (Total Cost + Residual Risk)."""
    verified_value: float = 1.0
    reliability: float = 1.0
    adaptability: float = 1.0
    total_cost: float = 1.0
    residual_risk: float = 0.1

    def calculate_score(self) -> float:
        denom = max(0.001, self.total_cost + self.residual_risk)
        return (self.verified_value * self.reliability * self.adaptability) / denom

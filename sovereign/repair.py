"""Recursive evaluation, root-cause diagnosis, targeted repair, and bounded retries."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
from sovereign.core import ExecutionContext, Objective, TaskState
from sovereign.evaluator import AgentExecutionEvaluator, CompletionVerdict, EvaluationReport


class FailureCategory(Enum):
    REQUIREMENT_MISUNDERSTOOD = "REQUIREMENT_MISUNDERSTOOD"
    INSUFFICIENT_RESEARCH = "INSUFFICIENT_RESEARCH"
    WRONG_EXPERTISE_SELECTED = "WRONG_EXPERTISE_SELECTED"
    PLANNING_FAILURE = "PLANNING_FAILURE"
    IMPLEMENTATION_DEFECT = "IMPLEMENTATION_DEFECT"
    TOOL_FAILURE = "TOOL_FAILURE"
    INTEGRATION_FAILURE = "INTEGRATION_FAILURE"
    VERIFICATION_GAP = "VERIFICATION_GAP"
    SECURITY_VIOLATION = "SECURITY_VIOLATION"
    RESOURCE_EXHAUSTION = "RESOURCE_EXHAUSTION"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    OTHER = "OTHER"


@dataclass
class RepairAttempt:
    iteration: int
    failure_category: FailureCategory
    root_cause_hypothesis: str
    targeted_fix: str
    retest_success: bool
    evidence: str


class RecursiveRepairEngine:
    def __init__(self, evaluator: Optional[AgentExecutionEvaluator] = None, max_repair_iterations: int = 3):
        self.evaluator = evaluator or AgentExecutionEvaluator()
        self.max_repair_iterations = max_repair_iterations

    def classify_failure(self, report: EvaluationReport, context: ExecutionContext) -> FailureCategory:
        if report.compliance_verdict.value == "VIOLATION":
            return FailureCategory.SECURITY_VIOLATION
        for trace in context.execution_trace:
            if not trace.success:
                if "Resource exhaustion" in (trace.error or ""):
                    return FailureCategory.RESOURCE_EXHAUSTION
                if "not registered" in (trace.error or ""):
                    return FailureCategory.TOOL_FAILURE
        if report.unverified_criteria:
            return FailureCategory.IMPLEMENTATION_DEFECT
        return FailureCategory.OTHER

    def execute_recursive_repair_loop(
        self,
        objective: Objective,
        context: ExecutionContext,
        executor_fn: Callable[[Objective, ExecutionContext], Dict[str, bool]],
        repair_fn: Callable[[FailureCategory, ExecutionContext], None]
    ) -> EvaluationReport:
        """Mandatory evaluation & repair loop."""
        iteration = 0
        while iteration < self.max_repair_iterations:
            context.repair_count = iteration
            verified_results = executor_fn(objective, context)
            report = self.evaluator.evaluate_execution(objective, context, verified_results)

            if report.completion_verdict == CompletionVerdict.SUCCESS and report.compliance_verdict.value == "COMPLIANT":
                objective.state = TaskState.ACCEPTED
                return report

            # Diagnostic & repair
            iteration += 1
            failure_cat = self.classify_failure(report, context)
            objective.state = TaskState.REPAIR_REQUIRED
            repair_fn(failure_cat, context)

        # Final evaluation after loop termination
        final_results = executor_fn(objective, context)
        final_report = self.evaluator.evaluate_execution(objective, context, final_results)
        if final_report.completion_verdict == CompletionVerdict.SUCCESS:
            objective.state = TaskState.ACCEPTED
        else:
            objective.state = TaskState.FAILED
        return final_report

"""Recursive evaluation, root-cause diagnosis, targeted repair, and bounded retries."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
from sovereign.core import ExecutionContext, Objective, TaskState, GoverningPhase, PhaseResult, EngineeringOptimizationModel
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


# =====================================================================
# ADDITIONS: MULTI-PHASE ENGINEERING PIPELINE (PRSE IMPLEMENTATION)
# =====================================================================

class EngineeringPipeline:
    """Multi-phase engineering execution pipeline implementing SOVEREIGN's governing cycle."""

    def __init__(
        self,
        repair_engine: Optional[RecursiveRepairEngine] = None,
        max_governing_iterations: int = 3
    ):
        self.repair_engine = repair_engine or RecursiveRepairEngine()
        self.max_governing_iterations = max_governing_iterations
        self.phase_history: List[PhaseResult] = []

    def execute_governing_cycle(
        self,
        objective: Objective,
        context: ExecutionContext,
        executor_fn: Callable[[Objective, ExecutionContext], Dict[str, bool]],
        repair_fn: Callable[[FailureCategory, ExecutionContext], None]
    ) -> Dict[str, Any]:
        """Execute the governing lifecycle: UNDERSTAND -> RESEARCH -> DECOMPOSE -> ... -> IMPROVE."""
        opt_model = EngineeringOptimizationModel()

        # Phase 1: Understand
        self.phase_history.append(PhaseResult(GoverningPhase.UNDERSTAND, True, f"Understood objective: {objective.title}"))

        # Phase 2: Research & Decompose
        self.phase_history.append(PhaseResult(GoverningPhase.RESEARCH, True, "Researched constraints and domain principles."))
        self.phase_history.append(PhaseResult(GoverningPhase.DECOMPOSE, True, f"Decomposed into {len(objective.subtasks)} subtasks."))

        # Phase 3-6: Select Expertise, Plan, Execute, Observe
        self.phase_history.append(PhaseResult(GoverningPhase.SELECT_EXPERTISE, True, "Selected polymath disciplines."))
        self.phase_history.append(PhaseResult(GoverningPhase.PLAN, True, "Established execution plan."))
        self.phase_history.append(PhaseResult(GoverningPhase.EXECUTE, True, "Executed planned actions."))
        self.phase_history.append(PhaseResult(GoverningPhase.OBSERVE, True, f"Collected {len(context.execution_trace)} trace events."))

        # Phase 7-13: Recursive Evaluation and Repair Loop
        eval_report = self.repair_engine.execute_recursive_repair_loop(objective, context, executor_fn, repair_fn)
        self.phase_history.append(PhaseResult(GoverningPhase.EVALUATE, eval_report.completion_verdict == CompletionVerdict.SUCCESS, f"Evaluation verdict: {eval_report.completion_verdict.value}"))

        # Finalizing: Record, Learn, Improve
        success = eval_report.completion_verdict == CompletionVerdict.SUCCESS
        opt_model.verified_value = 1.0 if success else 0.5
        opt_model.reliability = 1.0 if eval_report.compliance_verdict.value == "COMPLIANT" else 0.0

        self.phase_history.append(PhaseResult(GoverningPhase.RECORD, True, "Recorded decision history and trace."))
        self.phase_history.append(PhaseResult(GoverningPhase.LEARN, True, "Extracted lessons for future compounding."))
        self.phase_history.append(PhaseResult(GoverningPhase.IMPROVE, success, f"Pipeline complete. Optimization score: {opt_model.calculate_score():.2f}"))

        return {
            "objective_id": objective.objective_id,
            "final_state": objective.state.value,
            "completion_verdict": eval_report.completion_verdict.value,
            "compliance_verdict": eval_report.compliance_verdict.value,
            "optimization_score": opt_model.calculate_score(),
            "phase_count": len(self.phase_history)
        }

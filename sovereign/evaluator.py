"""Execution evaluation: completion verdicts, policy compliance, and execution quality rubrics."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional
from sovereign.core import ExecutionContext, Objective, TaskState


class CompletionVerdict(Enum):
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    UNVERIFIED = "UNVERIFIED"


class PolicyComplianceVerdict(Enum):
    COMPLIANT = "COMPLIANT"
    VIOLATION = "VIOLATION"
    UNVERIFIED = "UNVERIFIED"


@dataclass
class EvaluationReport:
    completion_verdict: CompletionVerdict
    compliance_verdict: PolicyComplianceVerdict
    quality_scores: Dict[str, float] = field(default_factory=dict)
    unverified_criteria: List[str] = field(default_factory=list)
    findings: List[str] = field(default_factory=list)
    evidence_collected: List[str] = field(default_factory=list)

    def format_summary(self) -> str:
        """Return a structured, human-readable summary of evaluation results for agent runtimes."""
        lines = [
            "Evaluation Summary:",
            f"  Completion: {self.completion_verdict.value}",
            f"  Compliance: {self.compliance_verdict.value}",
        ]
        if self.quality_scores:
            scores_str = ", ".join(f"{k}={v:.2f}" for k, v in self.quality_scores.items())
            lines.append(f"  Quality Scores: {scores_str}")
        if self.unverified_criteria:
            lines.append(f"  Unverified Criteria: {', '.join(self.unverified_criteria)}")
        return "\n".join(lines)


class AgentExecutionEvaluator:
    def evaluate_execution(
        self,
        objective: Objective,
        context: ExecutionContext,
        independently_verified_results: Optional[Dict[str, bool]] = None
    ) -> EvaluationReport:
        verified_map = independently_verified_results or {}
        unverified = []
        passed_count = 0
        total_mandatory = 0

        for criterion in objective.acceptance_criteria:
            if criterion.mandatory:
                total_mandatory += 1
            is_passed = verified_map.get(criterion.criterion_id, False)
            if is_passed:
                criterion.verified = True
                passed_count += 1
            else:
                unverified.append(criterion.criterion_id)

        # Completion verdict
        if total_mandatory > 0 and passed_count == total_mandatory:
            completion_verdict = CompletionVerdict.SUCCESS
        elif passed_count > 0:
            completion_verdict = CompletionVerdict.PARTIAL
        elif not verified_map:
            completion_verdict = CompletionVerdict.UNVERIFIED
        else:
            completion_verdict = CompletionVerdict.FAILED

        # Compliance verdict
        violations = [trace for trace in context.execution_trace if not trace.success and "Permission denied" in (trace.error or "")]
        compliance_verdict = PolicyComplianceVerdict.VIOLATION if violations else PolicyComplianceVerdict.COMPLIANT

        quality_scores = {
            "correctness": 1.0 if completion_verdict == CompletionVerdict.SUCCESS else (0.5 if completion_verdict == CompletionVerdict.PARTIAL else 0.0),
            "completeness": passed_count / total_mandatory if total_mandatory > 0 else 0.0,
            "evidence_quality": len(context.execution_trace) / max(1, context.tool_call_count)
        }

        evidence = [f"Trace item: {t.tool_name} success={t.success}" for t in context.execution_trace]

        return EvaluationReport(
            completion_verdict=completion_verdict,
            compliance_verdict=compliance_verdict,
            quality_scores=quality_scores,
            unverified_criteria=unverified,
            findings=[f"Failed traces count: {len(violations)}"],
            evidence_collected=evidence
        )

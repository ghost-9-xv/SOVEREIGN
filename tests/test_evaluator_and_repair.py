"""Tests for Evaluator and Recursive Repair Engine implementing Part 22 Acceptance Tests (Test 5, 6, 14)."""

import pytest
from sovereign.core import AcceptanceCriterion, ExecutionContext, Objective, TaskState, ToolContract, ToolExecutionResult
from sovereign.evaluator import AgentExecutionEvaluator, CompletionVerdict, PolicyComplianceVerdict
from sovereign.repair import FailureCategory, RecursiveRepairEngine, EngineeringPipeline


def test_part22_test5_completion_verification():
    """TEST 5: COMPLETION VERIFICATION - Evaluator distinguishes reported success from actual execution evidence."""
    evaluator = AgentExecutionEvaluator()
    obj = Objective(
        objective_id="obj_comp",
        title="Completion Test",
        description="Verify completion checks",
        acceptance_criteria=[
            AcceptanceCriterion("c1", "Requirement 1 verified", mandatory=True),
            AcceptanceCriterion("c2", "Requirement 2 verified", mandatory=True)
        ]
    )
    context = ExecutionContext(obj)

    # Case 1: Unverified execution (no independent verified results)
    report_unverified = evaluator.evaluate_execution(obj, context)
    assert report_unverified.completion_verdict == CompletionVerdict.UNVERIFIED
    assert len(report_unverified.unverified_criteria) == 2

    # Case 2: Partial verification
    report_partial = evaluator.evaluate_execution(obj, context, independently_verified_results={"c1": True, "c2": False})
    assert report_partial.completion_verdict == CompletionVerdict.PARTIAL

    # Case 3: Complete verification
    report_success = evaluator.evaluate_execution(obj, context, independently_verified_results={"c1": True, "c2": True})
    assert report_success.completion_verdict == CompletionVerdict.SUCCESS

    # Test summary formatting
    summary_text = report_success.format_summary()
    assert "Evaluation Summary:" in summary_text
    assert "Completion: SUCCESS" in summary_text


def test_part22_test6_policy_separation():
    """TEST 6: POLICY SEPARATION - High task quality cannot compensate for a security violation."""
    evaluator = AgentExecutionEvaluator()
    obj = Objective(
        objective_id="obj_sec",
        title="Security Test",
        description="Verify policy compliance separation",
        acceptance_criteria=[AcceptanceCriterion("c1", "Task completed", mandatory=True)]
    )
    context = ExecutionContext(obj, permissions=[])

    # Simulate failed permission attempt in trace
    contract = ToolContract("unauthorized_tool", "desc", {}, {}, required_permissions=["admin"])
    context.register_tool(contract)
    context.execute_tool("unauthorized_tool")

    report = evaluator.evaluate_execution(obj, context, independently_verified_results={"c1": True})
    assert report.completion_verdict == CompletionVerdict.SUCCESS
    assert report.compliance_verdict == PolicyComplianceVerdict.VIOLATION


def test_recursive_repair_loop():
    """Verify recursive repair loop executes, classifies failures, and repairs defects."""
    repair_engine = RecursiveRepairEngine(max_repair_iterations=3)
    obj = Objective(
        objective_id="obj_repair",
        title="Repair Test",
        description="Test recursive repair",
        acceptance_criteria=[AcceptanceCriterion("c1", "Fixed bug", mandatory=True)]
    )
    context = ExecutionContext(obj)

    attempt_counter = {"count": 0}

    def mock_executor(o: Objective, ctx: ExecutionContext):
        attempt_counter["count"] += 1
        if attempt_counter["count"] < 2:
            return {"c1": False}
        return {"c1": True}

    def mock_repair(cat: FailureCategory, ctx: ExecutionContext):
        ctx.execution_trace.append(ToolExecutionResult("repair", True, "Applied fix"))

    report = repair_engine.execute_recursive_repair_loop(obj, context, mock_executor, mock_repair)
    assert report.completion_verdict == CompletionVerdict.SUCCESS
    assert obj.state == TaskState.ACCEPTED
    assert attempt_counter["count"] == 2


def test_engineering_pipeline_execution():
    """Verify EngineeringPipeline executes the full governing cycle and optimization heuristic."""
    pipeline = EngineeringPipeline()
    obj = Objective(
        objective_id="obj_pipe",
        title="Engineering Pipeline Test",
        description="Verify governing lifecycle execution",
        acceptance_criteria=[AcceptanceCriterion("c1", "Pipeline complete", mandatory=True)]
    )
    context = ExecutionContext(obj)

    def mock_executor(o: Objective, ctx: ExecutionContext):
        return {"c1": True}

    def mock_repair(cat: FailureCategory, ctx: ExecutionContext):
        pass

    res = pipeline.execute_governing_cycle(obj, context, mock_executor, mock_repair)
    assert res["completion_verdict"] == "SUCCESS"
    assert res["compliance_verdict"] == "COMPLIANT"
    assert res["optimization_score"] > 0
    assert len(pipeline.phase_history) >= 10

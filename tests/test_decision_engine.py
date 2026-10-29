"""Tests for Decision Engine implementing Part 22 Acceptance Tests (Test 1, 2, 3, 4, 7, 11, 12)."""

import pytest
from sovereign.decision_engine import (
    ChoiceQuestion, DecisionEngine, DeterministicMockProvider, QuestionType,
    RubricScoreQuestion, StructuredDecisionContract
)


def test_part22_test1_schema_validation():
    """TEST 1: SCHEMA VALIDATION - Malformed decision responses must be rejected safely."""
    engine = DecisionEngine(DeterministicMockProvider(mocked_responses={"score": "NOT_A_NUMBER"}))
    res = engine.evaluate_score(
        question_text="Quality rating",
        min_score=0.0,
        max_score=5.0,
        rubric={0: "Poor", 5: "Excellent"},
        context={}
    )
    assert res.valid is False
    assert "invalid format" in res.error_message


def test_part22_test2_category_control():
    """TEST 2: CATEGORY CONTROL - Unexpected categories must trigger fallback behavior."""
    engine = DecisionEngine(DeterministicMockProvider(mocked_responses={"choice": "UNAUTHORIZED_CATEGORY"}))
    allowed = ["REQUIREMENT_MISUNDERSTOOD", "TOOL_FAILURE", "OTHER"]
    res = engine.evaluate_choice("Classify failure", allowed_choices=allowed, context={}, fallback="OTHER")
    assert res.judgment_value == "OTHER"


def test_part22_test3_rubric_validation():
    """TEST 3: RUBRIC VALIDATION - Invalid scores out of range must be rejected."""
    engine = DecisionEngine(DeterministicMockProvider(mocked_responses={"score": 10.0}))
    res = engine.evaluate_score("Evaluate completeness", min_score=0.0, max_score=5.0, rubric={}, context={})
    assert res.valid is False
    assert "out of range" in res.error_message or "out of bounds" in res.error_message


def test_part22_test4_provenance():
    """TEST 4: PROVENANCE - Consequential judgments must be traceable to context and evidence."""
    engine = DecisionEngine(DeterministicMockProvider())
    context = {"evidence_keys": ["obs_101", "trace_502"]}
    res = engine.evaluate_choice("Select route", allowed_choices=["A", "B"], context=context)
    assert res.evidence_references == ["obs_101", "trace_502"]
    assert res.provider == "DeterministicMockProvider"


def test_part22_test7_uncertainty():
    """TEST 7: UNCERTAINTY - Noul judgments return explicit truth assessments."""
    engine = DecisionEngine(DeterministicMockProvider(mocked_responses={"truth": False}))
    res = engine.evaluate_noul("Does evidence prove claim?", evidence_refs=["ref_1"], context={})
    assert res.judgment_value is False
    assert res.confidence == 0.92


def test_part22_test11_provider_failure():
    """TEST 11: PROVIDER FAILURE - Unsupported provider operations trigger safe error responses."""
    engine = DecisionEngine(DeterministicMockProvider())
    contract = StructuredDecisionContract(question_type="INVALID_TYPE", question_data=None, context={})  # type: ignore
    res = engine.provider.evaluate(contract)
    assert res.valid is False
    assert "Unsupported question type" in res.error_message

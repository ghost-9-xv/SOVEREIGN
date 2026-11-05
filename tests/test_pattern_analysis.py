"""Tests for Pattern Analysis Engine implementing Part 22 Acceptance Tests (Test 8, 9, 10)."""

import time
import pytest
from sovereign.pattern_analysis import PatternAnalysisEngine, PatternStatus


def test_part22_test8_pattern_validation():
    """TEST 8: PATTERN VALIDATION - Repeated observations do not automatically prove a cause."""
    engine = PatternAnalysisEngine()
    engine.ingest_observation("service_a", "API_TIMEOUT", {"error_code": 504})
    engine.ingest_observation("service_a", "API_TIMEOUT", {"error_code": 504})

    patterns = engine.discover_patterns()
    assert len(patterns) == 1
    p = patterns[0]
    # Initially HYPOTHESIS until explicit validation
    assert p.status == PatternStatus.HYPOTHESIS

    # Validated after explicit validation check
    validated = engine.validate_pattern(p.pattern_id)
    assert validated is True
    assert p.status == PatternStatus.VALIDATED


def test_part22_test9_counterevidence():
    """TEST 9: COUNTEREVIDENCE - The system must preserve evidence challenging a candidate pattern."""
    engine = PatternAnalysisEngine()
    engine.ingest_observation("db_module", "QUERY_FAIL", {"error_code": 1001})
    engine.ingest_observation("db_module", "QUERY_FAIL", {"error_code": 1001})

    patterns = engine.discover_patterns()
    pattern_id = patterns[0].pattern_id

    # Add counterevidence
    success_add = engine.add_counterevidence(pattern_id, "Query succeeded under same conditions after cache clear.")
    assert success_add is True
    assert patterns[0].status == PatternStatus.REJECTED
    assert len(patterns[0].contradictory_evidence) == 1


def test_part22_test10_trend_validity():
    """TEST 10: TREND VALIDITY - Trend calculations use validated observations and measurement windows."""
    engine = PatternAnalysisEngine()
    engine.ingest_observation("auth_service", "LOGIN_FAILURE", {"user": "user1"})
    engine.ingest_observation("auth_service", "LOGIN_FAILURE", {"user": "user2"})

    trend = engine.calculate_trend("LOGIN_FAILURE", window_seconds=3600.0)
    assert trend["count"] == 2
    assert trend["window_seconds"] == 3600.0
    assert trend["rate_per_minute"] == 2 / 60.0

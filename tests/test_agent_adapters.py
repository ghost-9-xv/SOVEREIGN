"""Tests for AI Agent Skill Adapter."""

import pytest
from sovereign.core import ExecutionContext, Objective
from sovereign.integrations.agent_adapters.skill_adapter import SovereignSkillAdapter


def test_skill_adapter_manifests():
    adapter = SovereignSkillAdapter()
    manifests = adapter.get_skill_manifests()
    assert len(manifests) == 3
    names = [m["name"] for m in manifests]
    assert "sovereign_select_expertise" in names
    assert "sovereign_evaluate_decision" in names
    assert "sovereign_discover_patterns" in names


def test_skill_adapter_registration_and_execution():
    adapter = SovereignSkillAdapter()
    obj = Objective("obj_skill", "Skill Test", "Test skill tool calls")
    context = ExecutionContext(obj)

    adapter.register_skills_with_context(context)
    assert len(context.tool_contracts) == 3

    # Execute sovereign_select_expertise skill
    res_exp = context.execute_tool("sovereign_select_expertise", subtask_description="Implement user auth security")
    assert res_exp.success is True
    assert "Security Engineering" in res_exp.result["disciplines"]

    # Execute sovereign_evaluate_decision skill
    res_dec = context.execute_tool(
        "sovereign_evaluate_decision",
        question_type="CHOICE",
        question_text="Select failure category",
        allowed_choices=["TOOL_FAILURE", "SECURITY_VIOLATION"]
    )
    assert res_dec.success is True
    assert res_dec.result["valid"] is True

    # Execute sovereign_discover_patterns skill
    res_pat = context.execute_tool("sovereign_discover_patterns")
    assert res_pat.success is True
    assert "discovered_patterns_count" in res_pat.result

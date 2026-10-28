"""Tests for Core state, tool contracts, execution context, and Security policy enforcement."""

import pytest
from sovereign.core import (
    AcceptanceCriterion, ExecutionContext, Objective, Subtask, TaskState, ToolContract
)
from sovereign.security import SecurityManager, SecurityPolicy, SecurityViolationError


def test_task_state_transitions_and_decomposition():
    obj = Objective(
        objective_id="obj_1",
        title="Test Objective",
        description="Verify core objective flow",
        acceptance_criteria=[
            AcceptanceCriterion("c1", "Requirement 1 satisfied", mandatory=True)
        ]
    )
    assert obj.state == TaskState.REQUESTED

    subtask = Subtask(
        subtask_id="sub_1",
        objective="Subtask 1",
        parent_objective_id="obj_1",
        acceptance_criteria=[AcceptanceCriterion("c1", "Requirement 1 satisfied")]
    )
    obj.decompose([subtask])
    assert obj.state == TaskState.PLANNED
    assert len(obj.subtasks) == 1


def test_tool_contract_permissions_and_execution():
    policy = SecurityPolicy(allowed_permissions={"read_file"})
    sec_mgr = SecurityManager(policy)

    obj = Objective("obj_2", "Tool Test", "Test tool contracts")
    context = ExecutionContext(obj, permissions=["read_file"])

    contract = ToolContract(
        name="read_file",
        description="Reads a file safely",
        input_schema={"required": ["filepath"]},
        output_schema={"required": ["content"]},
        required_permissions=["read_file"],
        handler=lambda filepath: f"Content of {filepath}"
    )
    context.register_tool(contract)

    # Valid call
    res = context.execute_tool("read_file", filepath="test.txt")
    assert res.success is True
    assert res.result == "Content of test.txt"

    # Permission denied call
    contract_admin = ToolContract(
        name="delete_database",
        description="Deletes db",
        input_schema={"required": []},
        output_schema={},
        required_permissions=["admin_db"],
        handler=lambda: "deleted"
    )
    context.register_tool(contract_admin)
    res_admin = context.execute_tool("delete_database")
    assert res_admin.success is False
    assert "Permission denied" in res_admin.error


def test_security_sanitization_and_enforcement():
    sec_mgr = SecurityManager(SecurityPolicy(allowed_permissions={"read_file"}))
    sec_mgr.enforce_permission("read_file")

    with pytest.raises(SecurityViolationError):
        sec_mgr.enforce_permission("execute_code")

    unsafe_input = "../../../etc/passwd"
    sanitized = sec_mgr.sanitize_input(unsafe_input)
    assert "../" not in sanitized

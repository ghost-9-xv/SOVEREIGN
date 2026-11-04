"""Tests for Memory Store and Outcome Traceability Graph."""

import pytest
from sovereign.memory import MemoryCategory, MemoryStore
from sovereign.outcome_graph import NodeType, OutcomeGraph, RelationType


def test_memory_store_operations():
    store = MemoryStore()
    rec = store.store(
        category=MemoryCategory.EXPERTISE,
        content={"principle": "YAGNI", "rule": "Avoid speculative code"},
        source="unit_test",
        scope="project_sovereign"
    )
    assert rec.memory_id == "mem_1"
    assert rec.category == MemoryCategory.EXPERTISE

    retrieved = store.retrieve(category=MemoryCategory.EXPERTISE)
    assert len(retrieved) == 1
    assert retrieved[0].content["principle"] == "YAGNI"

    # Delete memory
    deleted = store.delete("mem_1")
    assert deleted is True
    assert len(store.retrieve()) == 0


def test_outcome_graph_decision_replay():
    graph = OutcomeGraph()

    node_obj = graph.add_node("obj_1", NodeType.OBJECTIVE, "Implement auth")
    node_res = graph.add_node("res_1", NodeType.RESEARCH, "Investigate JWT vs OAuth")
    node_out = graph.add_node("out_1", NodeType.OUTCOME, "Auth module implemented")

    graph.add_edge("obj_1", "res_1", RelationType.INVESTIGATED_BY)
    graph.add_edge("res_1", "out_1", RelationType.PRODUCED)

    path = graph.replay_decision_path("out_1")
    assert len(path) >= 1
    assert path[0]["target_id"] == "out_1"
    assert path[0]["relation"] == "PRODUCED"

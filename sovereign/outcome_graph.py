"""Evidence-linked outcome graph for decision replay, traceability, and relationship analysis."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class NodeType(Enum):
    OBJECTIVE = "OBJECTIVE"
    REQUIREMENT = "REQUIREMENT"
    ASSUMPTION = "ASSUMPTION"
    RESEARCH = "RESEARCH"
    EVIDENCE = "EVIDENCE"
    ARTIFACT = "ARTIFACT"
    TEST = "TEST"
    JUDGMENT = "JUDGMENT"
    OUTCOME = "OUTCOME"
    NEXT_DECISION = "NEXT_DECISION"


class RelationType(Enum):
    REQUIRES = "REQUIRES"
    DEPENDS_ON = "DEPENDS_ON"
    INVESTIGATED_BY = "INVESTIGATED_BY"
    INFORMED_BY = "INFORMED_BY"
    IMPLEMENTED_AS = "IMPLEMENTED_AS"
    VERIFIED_BY = "VERIFIED_BY"
    EVALUATED_BY = "EVALUATED_BY"
    PRODUCED = "PRODUCED"
    INFORMED = "INFORMED"


@dataclass
class GraphNode:
    node_id: str
    node_type: NodeType
    label: str
    data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdge:
    source_id: str
    target_id: str
    relation: RelationType
    metadata: Dict[str, Any] = field(default_factory=dict)


class OutcomeGraph:
    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []

    def add_node(self, node_id: str, node_type: NodeType, label: str, data: Optional[Dict[str, Any]] = None) -> GraphNode:
        node = GraphNode(node_id=node_id, node_type=node_type, label=label, data=data or {})
        self.nodes[node_id] = node
        return node

    def add_edge(self, source_id: str, target_id: str, relation: RelationType, metadata: Optional[Dict[str, Any]] = None) -> GraphEdge:
        edge = GraphEdge(source_id=source_id, target_id=target_id, relation=relation, metadata=metadata or {})
        self.edges.append(edge)
        return edge

    def replay_decision_path(self, target_outcome_id: str) -> List[Dict[str, Any]]:
        """Reconstruct decision path and evidence leading to a given outcome."""
        path = []
        incoming_edges = [e for e in self.edges if e.target_id == target_outcome_id]
        for e in incoming_edges:
            src_node = self.nodes.get(e.source_id)
            if src_node:
                path.append({
                    "source": src_node,
                    "relation": e.relation.value,
                    "target_id": target_outcome_id
                })
                # Recursive traverse
                path.extend(self.replay_decision_path(src_node.node_id))
        return path

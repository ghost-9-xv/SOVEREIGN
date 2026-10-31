/**
 * SOVEREIGN Outcome Graph
 * Evidence-linked representation of objectives, decisions, actions, artifacts, evaluations, failures, and outcomes (Part 16)
 */

import {
  GraphNode,
  GraphEdge,
  NodeType,
  RelationshipType
} from "./types.js";

export interface OutcomeGraphOptions {
  maxNodes?: number;
  maxEdges?: number;
}

export class OutcomeGraph {
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphEdge>();
  private options: Required<OutcomeGraphOptions>;
  private nodeCounter = 0;
  private edgeCounter = 0;

  constructor(options: OutcomeGraphOptions = {}) {
    this.options = {
      maxNodes: options.maxNodes ?? 10000,
      maxEdges: options.maxEdges ?? 50000
    };
  }

  createNode(type: NodeType, label: string, data: Record<string, unknown> = {}): GraphNode {
    if (this.nodes.size >= this.options.maxNodes) {
      throw new Error("Maximum nodes reached");
    }

    const node: GraphNode = {
      id: `node-${Date.now()}-${++this.nodeCounter}`,
      type,
      label,
      data,
      timestamp: new Date()
    };

    this.nodes.set(node.id, node);
    return node;
  }

  createEdge(fromId: string, toId: string, type: RelationshipType, metadata: Record<string, unknown> = {}): GraphEdge {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      throw new Error("Source or target node not found");
    }

    if (this.edges.size >= this.options.maxEdges) {
      throw new Error("Maximum edges reached");
    }

    const edge: GraphEdge = {
      id: `edge-${Date.now()}-${++this.edgeCounter}`,
      from: fromId,
      to: toId,
      type,
      metadata,
      timestamp: new Date()
    };

    this.edges.set(edge.id, edge);
    return edge;
  }

  linkObjectiveToRequirement(objectiveId: string, requirementId: string): GraphEdge {
    return this.createEdge(objectiveId, requirementId, "REQUIRES");
  }

  linkRequirementToArtifact(requirementId: string, artifactId: string): GraphEdge {
    return this.createEdge(requirementId, artifactId, "IMPLEMENTED_AS");
  }

  linkArtifactToTest(artifactId: string, testId: string): GraphEdge {
    return this.createEdge(artifactId, testId, "VERIFIED_BY");
  }

  linkTestToJudgment(testId: string, judgmentId: string): GraphEdge {
    return this.createEdge(testId, judgmentId, "EVALUATED_BY");
  }

  linkJudgmentToOutcome(judgmentId: string, outcomeId: string): GraphEdge {
    return this.createEdge(judgmentId, outcomeId, "PRODUCED");
  }

  linkOutcomeToDecision(outcomeId: string, decisionId: string): GraphEdge {
    return this.createEdge(outcomeId, decisionId, "INFORMED");
  }

  linkObservationToPattern(observationId: string, patternId: string): GraphEdge {
    return this.createEdge(observationId, patternId, "CONTRIBUTED_TO");
  }

  linkPatternToEvidence(patternId: string, evidenceId: string, supports: boolean): GraphEdge {
    return this.createEdge(patternId, evidenceId, supports ? "SUPPORTED_BY" : "CHALLENGED_BY");
  }

  linkPatternToRootCause(patternId: string, rootCauseId: string): GraphEdge {
    return this.createEdge(patternId, rootCauseId, "INFORMED");
  }

  linkRootCauseToExperiment(rootCauseId: string, experimentId: string): GraphEdge {
    return this.createEdge(rootCauseId, experimentId, "TESTED_BY");
  }

  linkExperimentToOutcome(experimentId: string, outcomeId: string): GraphEdge {
    return this.createEdge(experimentId, outcomeId, "PRODUCED");
  }

  linkOutcomeToImprovement(outcomeId: string, improvementId: string): GraphEdge {
    return this.createEdge(outcomeId, improvementId, "INFORMED");
  }

  linkFailureToRequirement(failureId: string, requirementId: string): GraphEdge {
    return this.createEdge(failureId, requirementId, "CHALLENGED_BY");
  }

  linkFailureToRootCause(failureId: string, rootCauseId: string): GraphEdge {
    return this.createEdge(failureId, rootCauseId, "INFORMED");
  }

  linkRootCauseToCorrectiveAction(rootCauseId: string, correctiveId: string): GraphEdge {
    return this.createEdge(rootCauseId, correctiveId, "INFORMED");
  }

  linkCorrectiveActionToRegressionTest(correctiveId: string, testId: string): GraphEdge {
    return this.createEdge(correctiveId, testId, "VERIFIED_BY");
  }

  linkRegressionTestToOutcome(testId: string, outcomeId: string): GraphEdge {
    return this.createEdge(testId, outcomeId, "PRODUCED");
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  getNodesByType(type: NodeType): GraphNode[] {
    return Array.from(this.nodes.values()).filter(n => n.type === type);
  }

  getEdgesByType(type: RelationshipType): GraphEdge[] {
    return Array.from(this.edges.values()).filter(e => e.type === type);
  }

  getOutgoingEdges(nodeId: string): GraphEdge[] {
    return Array.from(this.edges.values()).filter(e => e.from === nodeId);
  }

  getIncomingEdges(nodeId: string): GraphEdge[] {
    return Array.from(this.edges.values()).filter(e => e.to === nodeId);
  }

  reconstructDecisionPath(decisionNodeId: string): DecisionPath {
    const path: DecisionPath = {
      decisionNode: this.nodes.get(decisionNodeId),
      evidenceChain: [],
      assumptions: [],
      alternatives: [],
      constraints: []
    };

    if (!path.decisionNode) {
      return path;
    }

    let currentNodes = [decisionNodeId];
    const visited = new Set<string>();

    while (currentNodes.length > 0) {
      const nextNodes: string[] = [];

      for (const nodeId of currentNodes) {
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const incoming = this.getIncomingEdges(nodeId);
        for (const edge of incoming) {
          const sourceNode = this.nodes.get(edge.from);
          if (sourceNode) {
            if (sourceNode.type === "EVIDENCE") {
              path.evidenceChain.push({
                node: sourceNode,
                relationship: edge.type,
                metadata: edge.metadata
              });
            } else if (sourceNode.type === "ASSUMPTION") {
              path.assumptions.push({
                node: sourceNode,
                relationship: edge.type,
                metadata: edge.metadata
              });
            } else if (sourceNode.type === "REQUIREMENT") {
              path.constraints.push({
                node: sourceNode,
                relationship: edge.type,
                metadata: edge.metadata
              });
            }
            nextNodes.push(edge.from);
          }
        }
      }

      currentNodes = nextNodes;
    }

    return path;
  }

  findPath(fromId: string, toId: string, maxDepth: number = 10): GraphPath[] {
    const paths: GraphPath[] = [];
    const queue: { path: GraphEdge[]; currentId: string; depth: number }[] = [
      { path: [], currentId: fromId, depth: 0 }
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { path, currentId, depth } = queue.shift()!;

      if (depth > maxDepth) continue;
      if (currentId === toId) {
        paths.push({ edges: path, length: path.length });
        continue;
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const outgoing = this.getOutgoingEdges(currentId);
      for (const edge of outgoing) {
        queue.push({
          path: [...path, edge],
          currentId: edge.to,
          depth: depth + 1
        });
      }
    }

    return paths;
  }

  getStats(): GraphStats {
    const nodeTypes: Record<string, number> = {};
    const edgeTypes: Record<string, number> = {};

    for (const node of this.nodes.values()) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    }

    for (const edge of this.edges.values()) {
      edgeTypes[edge.type] = (edgeTypes[edge.type] || 0) + 1;
    }

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      nodeTypes,
      edgeTypes
    };
  }

  export(): string {
    return JSON.stringify({
      nodes: Array.from(this.nodes.entries()),
      edges: Array.from(this.edges.entries())
    }, null, 2);
  }

  import(json: string): void {
    const data = JSON.parse(json);
    this.nodes = new Map(data.nodes);
    this.edges = new Map(data.edges);
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.nodeCounter = 0;
    this.edgeCounter = 0;
  }
}

export interface DecisionPath {
  decisionNode: GraphNode | undefined;
  evidenceChain: { node: GraphNode; relationship: RelationshipType; metadata: Record<string, unknown> }[];
  assumptions: { node: GraphNode; relationship: RelationshipType; metadata: Record<string, unknown> }[];
  alternatives: GraphNode[];
  constraints: { node: GraphNode; relationship: RelationshipType; metadata: Record<string, unknown> }[];
}

export interface GraphPath {
  edges: GraphEdge[];
  length: number;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  nodeTypes: Record<string, number>;
  edgeTypes: Record<string, number>;
}

/**
 * SOVEREIGN Outcome Graph
 * Evidence-linked representation of objectives, decisions, actions, artifacts, evaluations, failures, and outcomes (Part 16)
 */
import { GraphNode, GraphEdge, NodeType, RelationshipType } from "./types.js";
export interface OutcomeGraphOptions {
    maxNodes?: number;
    maxEdges?: number;
}
export declare class OutcomeGraph {
    private nodes;
    private edges;
    private options;
    private nodeCounter;
    private edgeCounter;
    constructor(options?: OutcomeGraphOptions);
    createNode(type: NodeType, label: string, data?: Record<string, unknown>): GraphNode;
    createEdge(fromId: string, toId: string, type: RelationshipType, metadata?: Record<string, unknown>): GraphEdge;
    linkObjectiveToRequirement(objectiveId: string, requirementId: string): GraphEdge;
    linkRequirementToArtifact(requirementId: string, artifactId: string): GraphEdge;
    linkArtifactToTest(artifactId: string, testId: string): GraphEdge;
    linkTestToJudgment(testId: string, judgmentId: string): GraphEdge;
    linkJudgmentToOutcome(judgmentId: string, outcomeId: string): GraphEdge;
    linkOutcomeToDecision(outcomeId: string, decisionId: string): GraphEdge;
    linkObservationToPattern(observationId: string, patternId: string): GraphEdge;
    linkPatternToEvidence(patternId: string, evidenceId: string, supports: boolean): GraphEdge;
    linkPatternToRootCause(patternId: string, rootCauseId: string): GraphEdge;
    linkRootCauseToExperiment(rootCauseId: string, experimentId: string): GraphEdge;
    linkExperimentToOutcome(experimentId: string, outcomeId: string): GraphEdge;
    linkOutcomeToImprovement(outcomeId: string, improvementId: string): GraphEdge;
    linkFailureToRequirement(failureId: string, requirementId: string): GraphEdge;
    linkFailureToRootCause(failureId: string, rootCauseId: string): GraphEdge;
    linkRootCauseToCorrectiveAction(rootCauseId: string, correctiveId: string): GraphEdge;
    linkCorrectiveActionToRegressionTest(correctiveId: string, testId: string): GraphEdge;
    linkRegressionTestToOutcome(testId: string, outcomeId: string): GraphEdge;
    getNode(id: string): GraphNode | undefined;
    getEdge(id: string): GraphEdge | undefined;
    getAllNodes(): GraphNode[];
    getAllEdges(): GraphEdge[];
    getNodesByType(type: NodeType): GraphNode[];
    getEdgesByType(type: RelationshipType): GraphEdge[];
    getOutgoingEdges(nodeId: string): GraphEdge[];
    getIncomingEdges(nodeId: string): GraphEdge[];
    reconstructDecisionPath(decisionNodeId: string): DecisionPath;
    findPath(fromId: string, toId: string, maxDepth?: number): GraphPath[];
    getStats(): GraphStats;
    export(): string;
    import(json: string): void;
    clear(): void;
}
export interface DecisionPath {
    decisionNode: GraphNode | undefined;
    evidenceChain: {
        node: GraphNode;
        relationship: RelationshipType;
        metadata: Record<string, unknown>;
    }[];
    assumptions: {
        node: GraphNode;
        relationship: RelationshipType;
        metadata: Record<string, unknown>;
    }[];
    alternatives: GraphNode[];
    constraints: {
        node: GraphNode;
        relationship: RelationshipType;
        metadata: Record<string, unknown>;
    }[];
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
//# sourceMappingURL=outcome-graph.d.ts.map
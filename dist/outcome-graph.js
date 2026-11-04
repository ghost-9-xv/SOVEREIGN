/**
 * SOVEREIGN Outcome Graph
 * Evidence-linked representation of objectives, decisions, actions, artifacts, evaluations, failures, and outcomes (Part 16)
 */
export class OutcomeGraph {
    nodes = new Map();
    edges = new Map();
    options;
    nodeCounter = 0;
    edgeCounter = 0;
    constructor(options = {}) {
        this.options = {
            maxNodes: options.maxNodes ?? 10000,
            maxEdges: options.maxEdges ?? 50000
        };
    }
    createNode(type, label, data = {}) {
        if (this.nodes.size >= this.options.maxNodes) {
            throw new Error("Maximum nodes reached");
        }
        const node = {
            id: `node-${Date.now()}-${++this.nodeCounter}`,
            type,
            label,
            data,
            timestamp: new Date()
        };
        this.nodes.set(node.id, node);
        return node;
    }
    createEdge(fromId, toId, type, metadata = {}) {
        if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
            throw new Error("Source or target node not found");
        }
        if (this.edges.size >= this.options.maxEdges) {
            throw new Error("Maximum edges reached");
        }
        const edge = {
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
    linkObjectiveToRequirement(objectiveId, requirementId) {
        return this.createEdge(objectiveId, requirementId, "REQUIRES");
    }
    linkRequirementToArtifact(requirementId, artifactId) {
        return this.createEdge(requirementId, artifactId, "IMPLEMENTED_AS");
    }
    linkArtifactToTest(artifactId, testId) {
        return this.createEdge(artifactId, testId, "VERIFIED_BY");
    }
    linkTestToJudgment(testId, judgmentId) {
        return this.createEdge(testId, judgmentId, "EVALUATED_BY");
    }
    linkJudgmentToOutcome(judgmentId, outcomeId) {
        return this.createEdge(judgmentId, outcomeId, "PRODUCED");
    }
    linkOutcomeToDecision(outcomeId, decisionId) {
        return this.createEdge(outcomeId, decisionId, "INFORMED");
    }
    linkObservationToPattern(observationId, patternId) {
        return this.createEdge(observationId, patternId, "CONTRIBUTED_TO");
    }
    linkPatternToEvidence(patternId, evidenceId, supports) {
        return this.createEdge(patternId, evidenceId, supports ? "SUPPORTED_BY" : "CHALLENGED_BY");
    }
    linkPatternToRootCause(patternId, rootCauseId) {
        return this.createEdge(patternId, rootCauseId, "INFORMED");
    }
    linkRootCauseToExperiment(rootCauseId, experimentId) {
        return this.createEdge(rootCauseId, experimentId, "TESTED_BY");
    }
    linkExperimentToOutcome(experimentId, outcomeId) {
        return this.createEdge(experimentId, outcomeId, "PRODUCED");
    }
    linkOutcomeToImprovement(outcomeId, improvementId) {
        return this.createEdge(outcomeId, improvementId, "INFORMED");
    }
    linkFailureToRequirement(failureId, requirementId) {
        return this.createEdge(failureId, requirementId, "CHALLENGED_BY");
    }
    linkFailureToRootCause(failureId, rootCauseId) {
        return this.createEdge(failureId, rootCauseId, "INFORMED");
    }
    linkRootCauseToCorrectiveAction(rootCauseId, correctiveId) {
        return this.createEdge(rootCauseId, correctiveId, "INFORMED");
    }
    linkCorrectiveActionToRegressionTest(correctiveId, testId) {
        return this.createEdge(correctiveId, testId, "VERIFIED_BY");
    }
    linkRegressionTestToOutcome(testId, outcomeId) {
        return this.createEdge(testId, outcomeId, "PRODUCED");
    }
    getNode(id) {
        return this.nodes.get(id);
    }
    getEdge(id) {
        return this.edges.get(id);
    }
    getAllNodes() {
        return Array.from(this.nodes.values());
    }
    getAllEdges() {
        return Array.from(this.edges.values());
    }
    getNodesByType(type) {
        return Array.from(this.nodes.values()).filter(n => n.type === type);
    }
    getEdgesByType(type) {
        return Array.from(this.edges.values()).filter(e => e.type === type);
    }
    getOutgoingEdges(nodeId) {
        return Array.from(this.edges.values()).filter(e => e.from === nodeId);
    }
    getIncomingEdges(nodeId) {
        return Array.from(this.edges.values()).filter(e => e.to === nodeId);
    }
    reconstructDecisionPath(decisionNodeId) {
        const path = {
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
        const visited = new Set();
        while (currentNodes.length > 0) {
            const nextNodes = [];
            for (const nodeId of currentNodes) {
                if (visited.has(nodeId))
                    continue;
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
                        }
                        else if (sourceNode.type === "ASSUMPTION") {
                            path.assumptions.push({
                                node: sourceNode,
                                relationship: edge.type,
                                metadata: edge.metadata
                            });
                        }
                        else if (sourceNode.type === "REQUIREMENT") {
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
    findPath(fromId, toId, maxDepth = 10) {
        const paths = [];
        const queue = [
            { path: [], currentId: fromId, depth: 0 }
        ];
        const visited = new Set();
        while (queue.length > 0) {
            const { path, currentId, depth } = queue.shift();
            if (depth > maxDepth)
                continue;
            if (currentId === toId) {
                paths.push({ edges: path, length: path.length });
                continue;
            }
            if (visited.has(currentId))
                continue;
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
    getStats() {
        const nodeTypes = {};
        const edgeTypes = {};
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
    export() {
        return JSON.stringify({
            nodes: Array.from(this.nodes.entries()),
            edges: Array.from(this.edges.entries())
        }, null, 2);
    }
    import(json) {
        const data = JSON.parse(json);
        this.nodes = new Map(data.nodes);
        this.edges = new Map(data.edges);
    }
    clear() {
        this.nodes.clear();
        this.edges.clear();
        this.nodeCounter = 0;
        this.edgeCounter = 0;
    }
}
//# sourceMappingURL=outcome-graph.js.map
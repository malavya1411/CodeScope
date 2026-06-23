/**
 * Graph service — directed graph data structure with DFS, BFS,
 * topological sort, cycle detection, and centrality scoring.
 */
import { Graph, GraphNode, GraphEdge } from '../models/graph';
export declare function createGraph<N, E>(): Graph<N, E>;
export declare function addNode<N, E>(graph: Graph<N, E>, node: GraphNode<N>): void;
export declare function addEdge<N, E>(graph: Graph<N, E>, edge: GraphEdge<E>): void;
export declare function bfs<N, E>(graph: Graph<N, E>, startId: string, visitor: (nodeId: string, depth: number) => void): void;
export declare function dfs<N, E>(graph: Graph<N, E>, startId: string, visitor: (nodeId: string) => void, visited?: Set<string>): void;
/**
 * Returns nodes in topological order (dependencies first).
 * Returns null if the graph has cycles.
 */
export declare function topologicalSort<N, E>(graph: Graph<N, E>): string[] | null;
/**
 * Find all cycles in the graph using DFS with coloring (white/gray/black).
 * Returns an array of cycle paths (each as array of node IDs).
 */
export declare function findCycles<N, E>(graph: Graph<N, E>): string[][];
/**
 * Calculate a simple degree centrality score for each node (normalized 0–1).
 */
export declare function calculateCentrality<N, E>(graph: Graph<N, E>): Map<string, number>;
/**
 * Find the shortest path between two nodes using BFS.
 * Returns null if no path exists.
 */
export declare function shortestPath<N, E>(graph: Graph<N, E>, sourceId: string, targetId: string): string[] | null;
/**
 * Convert a graph to a plain JSON-serializable object for webview messaging.
 */
export declare function serializeGraph<N, E>(graph: Graph<N, E>): {
    nodes: GraphNode<N>[];
    edges: GraphEdge<E>[];
};
//# sourceMappingURL=graphService.d.ts.map
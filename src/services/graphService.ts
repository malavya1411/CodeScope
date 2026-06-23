/**
 * Graph service — directed graph data structure with DFS, BFS,
 * topological sort, cycle detection, and centrality scoring.
 */

import { Graph, GraphNode, GraphEdge } from '../models/graph';

// ─── Graph Factory ────────────────────────────────────────────────────────────

export function createGraph<N, E>(): Graph<N, E> {
  return {
    nodes: new Map(),
    edges: [],
    adjacency: new Map(),
    reverseAdjacency: new Map(),
  };
}

// ─── Mutation ─────────────────────────────────────────────────────────────────

export function addNode<N, E>(graph: Graph<N, E>, node: GraphNode<N>): void {
  graph.nodes.set(node.id, node);
  if (!graph.adjacency.has(node.id)) {
    graph.adjacency.set(node.id, new Set());
  }
  if (!graph.reverseAdjacency.has(node.id)) {
    graph.reverseAdjacency.set(node.id, new Set());
  }
}

export function addEdge<N, E>(graph: Graph<N, E>, edge: GraphEdge<E>): void {
  graph.edges.push(edge);

  if (!graph.adjacency.has(edge.source)) {
    graph.adjacency.set(edge.source, new Set());
  }
  graph.adjacency.get(edge.source)!.add(edge.target);

  if (!graph.reverseAdjacency.has(edge.target)) {
    graph.reverseAdjacency.set(edge.target, new Set());
  }
  graph.reverseAdjacency.get(edge.target)!.add(edge.source);
}

// ─── Traversal ────────────────────────────────────────────────────────────────

export function bfs<N, E>(
  graph: Graph<N, E>,
  startId: string,
  visitor: (nodeId: string, depth: number) => void,
): void {
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) {continue;}
    visited.add(id);
    visitor(id, depth);

    const neighbours = graph.adjacency.get(id) ?? new Set();
    for (const neighbour of neighbours) {
      if (!visited.has(neighbour)) {
        queue.push({ id: neighbour, depth: depth + 1 });
      }
    }
  }
}

export function dfs<N, E>(
  graph: Graph<N, E>,
  startId: string,
  visitor: (nodeId: string) => void,
  visited = new Set<string>(),
): void {
  if (visited.has(startId)) {return;}
  visited.add(startId);
  visitor(startId);

  const neighbours = graph.adjacency.get(startId) ?? new Set();
  for (const neighbour of neighbours) {
    dfs(graph, neighbour, visitor, visited);
  }
}

// ─── Topological Sort (Kahn's algorithm) ─────────────────────────────────────

/**
 * Returns nodes in topological order (dependencies first).
 * Returns null if the graph has cycles.
 */
export function topologicalSort<N, E>(graph: Graph<N, E>): string[] | null {
  const inDegree = new Map<string, number>();

  // Initialize all nodes
  for (const id of graph.nodes.keys()) {
    inDegree.set(id, 0);
  }

  // Count in-degrees
  for (const edge of graph.edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Start with nodes that have no incoming edges
  const queue: string[] = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) {queue.push(id);}
  }

  const result: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);

    const neighbours = graph.adjacency.get(nodeId) ?? new Set();
    for (const neighbour of neighbours) {
      const newDegree = (inDegree.get(neighbour) ?? 0) - 1;
      inDegree.set(neighbour, newDegree);
      if (newDegree === 0) {
        queue.push(neighbour);
      }
    }
  }

  // If result doesn't contain all nodes, there's a cycle
  return result.length === graph.nodes.size ? result : null;
}

// ─── Cycle Detection ──────────────────────────────────────────────────────────

/**
 * Find all cycles in the graph using DFS with coloring (white/gray/black).
 * Returns an array of cycle paths (each as array of node IDs).
 */
export function findCycles<N, E>(graph: Graph<N, E>): string[][] {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const cycles: string[][] = [];

  for (const id of graph.nodes.keys()) {
    color.set(id, WHITE);
    parent.set(id, null);
  }

  function dfsVisit(nodeId: string): void {
    color.set(nodeId, GRAY);

    const neighbours = graph.adjacency.get(nodeId) ?? new Set();
    for (const neighbour of neighbours) {
      if (color.get(neighbour) === GRAY) {
        // Found a back-edge → cycle
        const cycle: string[] = [neighbour];
        let current: string | null = nodeId;
        while (current && current !== neighbour) {
          cycle.unshift(current);
          current = parent.get(current) ?? null;
        }
        cycle.unshift(neighbour);
        cycles.push(cycle);
      } else if (color.get(neighbour) === WHITE) {
        parent.set(neighbour, nodeId);
        dfsVisit(neighbour);
      }
    }
    color.set(nodeId, BLACK);
  }

  for (const id of graph.nodes.keys()) {
    if (color.get(id) === WHITE) {
      dfsVisit(id);
    }
  }

  return cycles;
}

// ─── Centrality ───────────────────────────────────────────────────────────────

/**
 * Calculate a simple degree centrality score for each node (normalized 0–1).
 */
export function calculateCentrality<N, E>(graph: Graph<N, E>): Map<string, number> {
  const centrality = new Map<string, number>();
  const n = graph.nodes.size;
  if (n <= 1) {
    for (const id of graph.nodes.keys()) {centrality.set(id, 0);}
    return centrality;
  }

  for (const id of graph.nodes.keys()) {
    const inDeg = (graph.reverseAdjacency.get(id)?.size ?? 0);
    const outDeg = (graph.adjacency.get(id)?.size ?? 0);
    // Normalized by max possible degree (n - 1)
    centrality.set(id, (inDeg + outDeg) / (2 * (n - 1)));
  }

  return centrality;
}

// ─── Shortest Path ────────────────────────────────────────────────────────────

/**
 * Find the shortest path between two nodes using BFS.
 * Returns null if no path exists.
 */
export function shortestPath<N, E>(
  graph: Graph<N, E>,
  sourceId: string,
  targetId: string,
): string[] | null {
  if (sourceId === targetId) {return [sourceId];}

  const visited = new Set<string>();
  const queue: Array<{ id: string; path: string[] }> = [{ id: sourceId, path: [sourceId] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (visited.has(id)) {continue;}
    visited.add(id);

    const neighbours = graph.adjacency.get(id) ?? new Set();
    for (const neighbour of neighbours) {
      const newPath = [...path, neighbour];
      if (neighbour === targetId) {return newPath;}
      if (!visited.has(neighbour)) {
        queue.push({ id: neighbour, path: newPath });
      }
    }
  }

  return null;
}

// ─── Serialization ────────────────────────────────────────────────────────────

/**
 * Convert a graph to a plain JSON-serializable object for webview messaging.
 */
export function serializeGraph<N, E>(graph: Graph<N, E>): {
  nodes: GraphNode<N>[];
  edges: GraphEdge<E>[];
} {
  return {
    nodes: Array.from(graph.nodes.values()),
    edges: graph.edges,
  };
}

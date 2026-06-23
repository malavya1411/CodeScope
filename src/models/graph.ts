/**
 * Graph data structures for dependency graphs, call graphs, and control flow graphs.
 */

import { Location, ArchitectureLayer, RiskLevel } from './types';

// ─── Generic Graph ────────────────────────────────────────────────────────────

export interface GraphNode<T = Record<string, unknown>> {
  id: string;
  label: string;
  data: T;
}

export interface GraphEdge<T = Record<string, unknown>> {
  id: string;
  source: string;  // node id
  target: string;  // node id
  label?: string;
  data: T;
}

export interface Graph<N = Record<string, unknown>, E = Record<string, unknown>> {
  nodes: Map<string, GraphNode<N>>;
  edges: GraphEdge<E>[];
  /** adjacency list: nodeId → set of neighbour nodeIds */
  adjacency: Map<string, Set<string>>;
  /** reverse adjacency: nodeId → set of nodeIds pointing to it */
  reverseAdjacency: Map<string, Set<string>>;
}

// ─── Dependency Graph ─────────────────────────────────────────────────────────

export interface DependencyNodeData {
  filePath: string;
  relativePath: string;
  extension: string;
  sizeBytes: number;
  linesOfCode: number;
  language: string;
  layer: ArchitectureLayer;
  inDegree: number;   // how many files import this
  outDegree: number;  // how many files this imports
  centrality: number; // normalized importance score
}

export interface DependencyEdgeData {
  specifiers: string[];  // which symbols are imported
  isDynamic: boolean;
  isTypeOnly: boolean;
}

export type DependencyGraph = Graph<DependencyNodeData, DependencyEdgeData>;

export interface CircularDependency {
  cycle: string[];  // ordered file paths forming the cycle
  severity: RiskLevel;
}

// ─── Call Graph ───────────────────────────────────────────────────────────────

export interface CallNodeData {
  functionName: string;
  filePath: string;
  relativePath: string;
  location: Location;
  isExternal: boolean;
  isRecursive: boolean;
  callCount: number;
}

export interface CallEdgeData {
  callCount: number;
  locations: Location[];
}

export type CallGraph = Graph<CallNodeData, CallEdgeData>;

export interface CallHierarchyResult {
  rootFunction: string;
  rootFile: string;
  callers: CallHierarchyNode[];   // who calls this (bottom-up)
  callees: CallHierarchyNode[];   // what this calls (top-down)
  totalDepth: number;
  externalCallCount: number;
  recursiveCallCount: number;
}

export interface CallHierarchyNode {
  id: string;
  functionName: string;
  filePath: string;
  relativePath: string;
  location: Location;
  isExternal: boolean;
  isRecursive: boolean;
  children: CallHierarchyNode[];
  depth: number;
}

// ─── Control Flow Graph (CFG) ────────────────────────────────────────────────

export enum CFGNodeType {
  Start = 'start',
  End = 'end',
  Process = 'process',
  Decision = 'decision',
  Loop = 'loop',
  Call = 'call',
  Return = 'return',
  Throw = 'throw',
  TryCatch = 'tryCatch',
}

export enum CFGEdgeType {
  Default = 'default',
  TrueBranch = 'true',
  FalseBranch = 'false',
  LoopBack = 'loopBack',
  Exception = 'exception',
}

export interface CFGNodeData {
  type: CFGNodeType;
  label: string;
  code?: string;
  location?: Location;
}

export interface CFGEdgeData {
  type: CFGEdgeType;
  label?: string;
}

export type CFGGraph = Graph<CFGNodeData, CFGEdgeData>;

export interface FlowAnalysisResult {
  functionName: string;
  filePath: string;
  cfg: CFGGraph;
  nodeCount: number;
  edgeCount: number;
  decisionCount: number;
  loopCount: number;
  maxPathLength: number;
}

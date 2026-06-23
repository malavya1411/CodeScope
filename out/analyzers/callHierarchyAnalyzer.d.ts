/**
 * Call Hierarchy Analyzer — builds a project-wide call graph to answer
 * "Who calls this?" and "What does this call?".
 */
import { CallGraph, CallHierarchyResult } from '../models/graph';
export declare function buildCallGraph(rootPath: string, onProgress?: (current: number, total: number) => void): Promise<CallGraph>;
export declare function getHierarchy(graph: CallGraph, startNodeId: string, direction: 'callers' | 'callees', maxDepth?: number): CallHierarchyResult | null;
//# sourceMappingURL=callHierarchyAnalyzer.d.ts.map
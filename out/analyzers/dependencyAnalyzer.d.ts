/**
 * Dependency Analyzer — scans all source files, extracts imports/exports,
 * resolves paths, builds a directed dependency graph, detects circular
 * dependencies, and ranks files by centrality.
 */
import { DependencyGraph, CircularDependency } from '../models/graph';
import { DependencyReport, UnusedExport } from '../models/analysis';
export declare function buildDependencyGraph(rootPath: string, onProgress?: (current: number, total: number) => void): Promise<DependencyGraph>;
export declare function detectCircularDependencies(graph: DependencyGraph, rootPath: string): CircularDependency[];
export declare function findUnusedExports(graph: DependencyGraph, rootPath: string): Promise<UnusedExport[]>;
export declare function buildDependencyReport(rootPath: string, onProgress?: (current: number, total: number) => void): Promise<DependencyReport>;
import { ReadingOrderEntry } from '../models/types';
export declare function generateReadingOrder(graph: DependencyGraph, rootPath: string): ReadingOrderEntry[];
//# sourceMappingURL=dependencyAnalyzer.d.ts.map
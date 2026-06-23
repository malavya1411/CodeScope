/**
 * Complexity Analyzer — Cyclomatic complexity, Cognitive complexity,
 * nested loop depth, Big-O estimation, and Code Smell Score.
 */
import * as ts from 'typescript';
import { ComplexityEntry } from '../models/analysis';
/**
 * Calculate McCabe cyclomatic complexity for a function node.
 * Base complexity = 1, +1 for each decision point.
 */
export declare function calculateCyclomaticComplexity(funcNode: ts.Node): number;
/**
 * Calculate cognitive complexity for a function node.
 * Adds penalty for nesting depth on top of the base increment.
 */
export declare function calculateCognitiveComplexity(funcNode: ts.Node): number;
export declare function calculateNestedLoopDepth(funcNode: ts.Node): number;
/**
 * Detect if a function calls itself by name.
 */
export declare function detectRecursion(funcNode: ts.FunctionLikeDeclaration): boolean;
/**
 * Heuristic: detect binary search by looking for mid-point arithmetic.
 */
export declare function detectBinarySearchPattern(funcNode: ts.Node): boolean;
export interface FunctionCallEntry {
    name: string;
    isMethod: boolean;
    object?: string;
}
export declare function extractFunctionCalls(funcBody: ts.Node): FunctionCallEntry[];
export declare function countAllocations(funcBody: ts.Node): {
    arrays: number;
    maps: number;
};
export declare function analyzeComplexityForFunction(funcNode: ts.FunctionLikeDeclaration, functionName: string, filePath: string, relativePath: string, loc: number, paramCount: number, sourceFile: ts.SourceFile): ComplexityEntry;
//# sourceMappingURL=complexityAnalyzer.d.ts.map
/**
 * Flow Analyzer — builds a Control Flow Graph (CFG) from a function's AST.
 * Produces nodes and edges suitable for React Flow visualization.
 */
import * as ts from 'typescript';
import { FlowAnalysisResult } from '../models/graph';
export declare function analyzeExecutionFlow(funcNode: ts.FunctionLikeDeclaration, functionName: string, sourceFile: ts.SourceFile, filePath: string): FlowAnalysisResult;
/**
 * Find a function node by name in a source file.
 */
export declare function findFunctionNodeByName(sourceFile: ts.SourceFile, name: string): ts.FunctionLikeDeclaration | null;
//# sourceMappingURL=flowAnalyzer.d.ts.map
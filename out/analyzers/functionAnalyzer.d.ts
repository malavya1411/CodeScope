/**
 * Function Analyzer — extracts function signatures, parameters, return types,
 * JSDoc, and per-function metrics from a parsed TypeScript/JavaScript file.
 */
import * as ts from 'typescript';
import { FunctionAnalysis } from '../models/types';
/**
 * Extract all function analyses from a source file.
 */
export declare function analyzeFunctions(sourceFile: ts.SourceFile, filePath: string, relativePath: string): FunctionAnalysis[];
//# sourceMappingURL=functionAnalyzer.d.ts.map
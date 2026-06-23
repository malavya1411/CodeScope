/**
 * AST Analyzer — generic AST traversal, node extraction, and
 * top-level declaration enumeration using the TypeScript Compiler API.
 */
import * as ts from 'typescript';
import { LanguageId } from '../models/types';
import { ImportInfo, ExportInfo } from '../models/types';
export declare function getLanguageId(filePath: string): LanguageId;
export declare function extractImports(sourceFile: ts.SourceFile, filePath: string): ImportInfo[];
export declare function extractExports(sourceFile: ts.SourceFile, filePath: string): ExportInfo[];
/**
 * Get the file-level JSDoc comment (first block comment in the file or @fileoverview).
 */
export declare function getFileOverviewComment(sourceFile: ts.SourceFile): string | undefined;
import { VariableInfo } from '../models/types';
export declare function extractTopLevelVariables(sourceFile: ts.SourceFile, filePath: string): VariableInfo[];
//# sourceMappingURL=astAnalyzer.d.ts.map
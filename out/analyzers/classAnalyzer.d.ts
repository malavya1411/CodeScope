/**
 * Class Analyzer — extracts class declarations, their methods,
 * properties, inheritance, interfaces, and decorators.
 */
import * as ts from 'typescript';
import { ClassAnalysis } from '../models/types';
/**
 * Extract all class analyses from a source file.
 */
export declare function analyzeClasses(sourceFile: ts.SourceFile, filePath: string, relativePath: string): ClassAnalysis[];
//# sourceMappingURL=classAnalyzer.d.ts.map
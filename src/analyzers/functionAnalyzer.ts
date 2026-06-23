/**
 * Function Analyzer — extracts function signatures, parameters, return types,
 * JSDoc, and per-function metrics from a parsed TypeScript/JavaScript file.
 */

import * as ts from 'typescript';
import * as path from 'path';
import {
  walkAST,
  getNodeText,
  getNodeLocation,
  getJSDoc,
} from '../services/parserService';
import {
  FunctionAnalysis,
  ParameterInfo,
  FunctionCallInfo,
  NodeKind,
  VariableKind,
  RiskLevel,
} from '../models/types';
import {
  calculateCyclomaticComplexity,
  calculateCognitiveComplexity,
  calculateNestedLoopDepth,
  detectRecursion,
  detectBinarySearchPattern,
  extractFunctionCalls,
  countAllocations,
} from './complexityAnalyzer';
import {
  calculateSmellScore,
  estimateTimeComplexity,
  estimateSpaceComplexity,
  cyclomaticToRisk,
  overallRiskLevel,
  getComplexityIssues,
} from '../utils/complexity';

// ─── Parameter Extraction ─────────────────────────────────────────────────────

function extractParameters(
  funcNode: ts.FunctionLikeDeclaration,
  sourceFile: ts.SourceFile,
): ParameterInfo[] {
  return funcNode.parameters.map((param): ParameterInfo => {
    const name = ts.isIdentifier(param.name)
      ? param.name.text
      : getNodeText(param.name, sourceFile);

    return {
      name,
      type: param.type ? getNodeText(param.type, sourceFile) : 'unknown',
      isOptional: !!param.questionToken || !!param.initializer,
      hasDefault: !!param.initializer,
      defaultValue: param.initializer ? getNodeText(param.initializer, sourceFile) : undefined,
      isRest: !!param.dotDotDotToken,
    };
  });
}

// ─── Return Type ──────────────────────────────────────────────────────────────

function extractReturnType(
  funcNode: ts.FunctionLikeDeclaration,
  sourceFile: ts.SourceFile,
): string {
  if (funcNode.type) {
    return getNodeText(funcNode.type, sourceFile);
  }
  // Infer from body if single expression
  if (funcNode.body && ts.isExpression(funcNode.body)) {
    return 'inferred';
  }
  return 'void';
}

// ─── Generic Parameters ───────────────────────────────────────────────────────

function extractGenericParams(
  funcNode: ts.FunctionLikeDeclaration,
  sourceFile: ts.SourceFile,
): string[] {
  if (!funcNode.typeParameters) {return [];}
  return funcNode.typeParameters.map((tp) => getNodeText(tp, sourceFile));
}

// ─── Function Name ────────────────────────────────────────────────────────────

function getFunctionName(
  node: ts.FunctionLikeDeclaration,
  sourceFile: ts.SourceFile,
): string {
  if (node.name && ts.isIdentifier(node.name)) {
    return node.name.text;
  }

  // Arrow function assigned to variable: const foo = () => {}
  if (
    ts.isVariableDeclaration(node.parent) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }

  // Property assignment: { foo: () => {} }
  if (
    ts.isPropertyAssignment(node.parent) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }

  return '<anonymous>';
}

// ─── NodeKind ─────────────────────────────────────────────────────────────────

function getNodeKind(node: ts.FunctionLikeDeclaration): NodeKind {
  if (ts.isConstructorDeclaration(node)) {return NodeKind.Constructor;}
  if (ts.isMethodDeclaration(node)) {return NodeKind.Method;}
  if (ts.isArrowFunction(node)) {return NodeKind.ArrowFunction;}
  return NodeKind.Function;
}

// ─── Async Detection ─────────────────────────────────────────────────────────

function isAsync(node: ts.FunctionLikeDeclaration): boolean {
  if (!ts.canHaveModifiers(node)) {return false;}
  const mods = ts.getModifiers(node);
  return mods?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
}

// ─── Is Exported ─────────────────────────────────────────────────────────────

function isExported(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) {return false;}
  const mods = ts.getModifiers(node);
  return mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

// ─── LOC Calculation ─────────────────────────────────────────────────────────

function countFunctionLOC(
  funcNode: ts.FunctionLikeDeclaration,
  sourceFile: ts.SourceFile,
): number {
  if (!funcNode.body) {return 0;}
  const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(funcNode.body.getStart());
  const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(funcNode.body.getEnd());
  return Math.max(0, endLine - startLine - 1); // exclude braces
}

// ─── Build FunctionCallInfo List ──────────────────────────────────────────────

function buildFunctionCallInfos(
  funcNode: ts.FunctionLikeDeclaration,
  filePath: string,
  sourceFile: ts.SourceFile,
): FunctionCallInfo[] {
  if (!funcNode.body) {return [];}

  const raw = extractFunctionCalls(funcNode.body);
  return raw.map((call): FunctionCallInfo => {
    const loc = { file: filePath, line: 0, column: 0 }; // simplified
    return {
      name: call.object ? `${call.object}.${call.name}` : call.name,
      isInternal: !call.isMethod || !call.object,
      sourceModule: call.object,
      location: loc,
    };
  });
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Extract all function analyses from a source file.
 */
export function analyzeFunctions(
  sourceFile: ts.SourceFile,
  filePath: string,
  relativePath: string,
): FunctionAnalysis[] {
  const results: FunctionAnalysis[] = [];
  let counter = 0;

  const isFunctionLike = (node: ts.Node): node is ts.FunctionLikeDeclaration =>
    ts.isFunctionDeclaration(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node);

  walkAST(sourceFile, (node) => {
    if (!isFunctionLike(node)) {return;}

    const funcNode = node as ts.FunctionLikeDeclaration;
    const name = getFunctionName(funcNode, sourceFile);
    const params = extractParameters(funcNode, sourceFile);
    const returnType = extractReturnType(funcNode, sourceFile);
    const genericParams = extractGenericParams(funcNode, sourceFile);
    const loc = countFunctionLOC(funcNode, sourceFile);
    const jsdoc = getJSDoc(funcNode, sourceFile);
    const location = getNodeLocation(funcNode, sourceFile, filePath);
    const kind = getNodeKind(funcNode);
    const isExportedFn = isExported(funcNode) || isExported(funcNode.parent);
    const isAsyncFn = isAsync(funcNode);

    const cyclomatic = calculateCyclomaticComplexity(funcNode);
    const cognitive = calculateCognitiveComplexity(funcNode);
    const nestedDepth = calculateNestedLoopDepth(funcNode);
    const isRecursive = detectRecursion(funcNode);
    const hasBinarySearch = detectBinarySearchPattern(funcNode);
    const calls = buildFunctionCallInfos(funcNode, filePath, sourceFile);
    const allocs = funcNode.body ? countAllocations(funcNode.body) : { arrays: 0, maps: 0 };

    const timeComplexity = estimateTimeComplexity(nestedDepth, isRecursive, hasBinarySearch);
    const spaceComplexity = estimateSpaceComplexity(isRecursive, allocs.arrays, allocs.maps);

    const smellScore = calculateSmellScore({
      cyclomaticComplexity: cyclomatic,
      cognitiveComplexity: cognitive,
      linesOfCode: loc,
      parameterCount: params.length,
      nestedLoopDepth: nestedDepth,
      functionCallCount: calls.length,
    });

    const riskLevel = overallRiskLevel(cyclomatic, cognitive, loc, params.length);

    counter++;

    results.push({
      id: `fn_${counter}_${name}`,
      name,
      kind,
      parameters: params,
      returnType,
      genericParams,
      linesOfCode: loc,
      totalLines: loc,
      cyclomaticComplexity: cyclomatic,
      cognitiveComplexity: cognitive,
      nestedLoopDepth: nestedDepth,
      estimatedTimeComplexity: timeComplexity,
      estimatedSpaceComplexity: spaceComplexity,
      codeSmellScore: smellScore,
      riskLevel,
      functionCalls: calls,
      isExported: isExportedFn,
      isAsync: isAsyncFn,
      isRecursive,
      jsdoc,
      location,
    });
  });

  return results;
}

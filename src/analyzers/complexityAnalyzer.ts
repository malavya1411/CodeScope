/**
 * Complexity Analyzer — Cyclomatic complexity, Cognitive complexity,
 * nested loop depth, Big-O estimation, and Code Smell Score.
 */

import * as ts from 'typescript';
import { walkAST } from '../services/parserService';
import {
  calculateSmellScore,
  estimateTimeComplexity,
  estimateSpaceComplexity,
  cyclomaticToRisk,
  getComplexityIssues,
} from '../utils/complexity';
import { ComplexityClass, RiskLevel } from '../models/types';
import { FunctionAnalysis } from '../models/types';
import { ComplexityEntry } from '../models/analysis';

// ─── Cyclomatic Complexity ────────────────────────────────────────────────────

/**
 * Calculate McCabe cyclomatic complexity for a function node.
 * Base complexity = 1, +1 for each decision point.
 */
export function calculateCyclomaticComplexity(funcNode: ts.Node): number {
  let complexity = 1;

  walkAST(funcNode, (node) => {
    switch (node.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ConditionalExpression:    // ternary
      case ts.SyntaxKind.SwitchStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CatchClause:
        complexity++;
        break;

      case ts.SyntaxKind.BinaryExpression: {
        const bin = node as ts.BinaryExpression;
        if (
          bin.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          bin.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          bin.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        ) {
          complexity++;
        }
        break;
      }
    }
  });

  return complexity;
}

// ─── Cognitive Complexity ─────────────────────────────────────────────────────

interface BreakPoint {
  nestingDepth: number;
}

/**
 * Calculate cognitive complexity for a function node.
 * Adds penalty for nesting depth on top of the base increment.
 */
export function calculateCognitiveComplexity(funcNode: ts.Node): number {
  let complexity = 0;

  function traverse(node: ts.Node, depth: number): void {
    let increment = 0;
    let addDepth = false;

    switch (node.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.SwitchStatement:
        increment = 1 + depth;
        addDepth = true;
        break;

      case ts.SyntaxKind.ConditionalExpression:
        increment = 1 + depth;
        break;

      case ts.SyntaxKind.BinaryExpression: {
        const bin = node as ts.BinaryExpression;
        if (
          bin.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          bin.operatorToken.kind === ts.SyntaxKind.BarBarToken
        ) {
          increment = 1;
        }
        break;
      }

      case ts.SyntaxKind.CatchClause:
        increment = 1;
        break;
    }

    complexity += increment;

    const nextDepth = addDepth ? depth + 1 : depth;
    ts.forEachChild(node, (child) => traverse(child, nextDepth));
  }

  ts.forEachChild(funcNode, (child) => traverse(child, 0));
  return complexity;
}

// ─── Nested Loop Depth ────────────────────────────────────────────────────────

const LOOP_KINDS = new Set([
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
]);

export function calculateNestedLoopDepth(funcNode: ts.Node): number {
  let maxDepth = 0;

  function traverse(node: ts.Node, currentDepth: number): void {
    const isLoop = LOOP_KINDS.has(node.kind);
    const nextDepth = isLoop ? currentDepth + 1 : currentDepth;
    if (nextDepth > maxDepth) {maxDepth = nextDepth;}
    ts.forEachChild(node, (child) => traverse(child, nextDepth));
  }

  traverse(funcNode, 0);
  return maxDepth;
}

// ─── Recursion Detection ──────────────────────────────────────────────────────

/**
 * Detect if a function calls itself by name.
 */
export function detectRecursion(funcNode: ts.FunctionLikeDeclaration): boolean {
  const funcName = getFunctionName(funcNode);
  if (!funcName) {return false;}

  let found = false;
  walkAST(funcNode.body!, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === funcName
    ) {
      found = true;
    }
  });

  return found;
}

// ─── Binary Search Pattern ────────────────────────────────────────────────────

/**
 * Heuristic: detect binary search by looking for mid-point arithmetic.
 */
export function detectBinarySearchPattern(funcNode: ts.Node): boolean {
  let found = false;
  walkAST(funcNode, (node) => {
    if (ts.isBinaryExpression(node)) {
      const text = node.getText();
      if (text.includes('Math.floor') && (text.includes('+ ') || text.includes('- ')) && text.includes('/ 2')) {
        found = true;
      }
    }
  });
  return found;
}

// ─── Function Calls ───────────────────────────────────────────────────────────

export interface FunctionCallEntry {
  name: string;
  isMethod: boolean;
  object?: string;
}

export function extractFunctionCalls(funcBody: ts.Node): FunctionCallEntry[] {
  const calls: FunctionCallEntry[] = [];
  const seen = new Set<string>();

  walkAST(funcBody, (node) => {
    if (!ts.isCallExpression(node)) {return;}

    const expr = node.expression;
    let name = '';
    let isMethod = false;
    let object: string | undefined;

    if (ts.isIdentifier(expr)) {
      name = expr.text;
    } else if (ts.isPropertyAccessExpression(expr)) {
      name = expr.name.text;
      isMethod = true;
      if (ts.isIdentifier(expr.expression)) {
        object = expr.expression.text;
      }
    }

    if (name && !seen.has(`${object ?? ''}.${name}`)) {
      seen.add(`${object ?? ''}.${name}`);
      calls.push({ name, isMethod, object });
    }
  });

  return calls;
}

// ─── Array / Map Allocations ──────────────────────────────────────────────────

export function countAllocations(funcBody: ts.Node): { arrays: number; maps: number } {
  let arrays = 0;
  let maps = 0;

  walkAST(funcBody, (node) => {
    if (ts.isArrayLiteralExpression(node)) {arrays++;}
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      (node.expression.text === 'Map' || node.expression.text === 'Set' ||
       node.expression.text === 'Array' || node.expression.text === 'Object')
    ) {
      maps++;
    }
  });

  return { arrays, maps };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getFunctionName(node: ts.FunctionLikeDeclaration): string | null {
  if (node.name && ts.isIdentifier(node.name)) {
    return node.name.text;
  }
  return null;
}

// ─── Full Complexity Analysis for a Function Node ────────────────────────────

export function analyzeComplexityForFunction(
  funcNode: ts.FunctionLikeDeclaration,
  functionName: string,
  filePath: string,
  relativePath: string,
  loc: number,
  paramCount: number,
  sourceFile: ts.SourceFile,
): ComplexityEntry {
  const cyclomatic = calculateCyclomaticComplexity(funcNode);
  const cognitive = calculateCognitiveComplexity(funcNode);
  const nestedLoopDepth = calculateNestedLoopDepth(funcNode);
  const isRecursive = detectRecursion(funcNode);
  const hasBinarySearch = detectBinarySearchPattern(funcNode);
  const calls = funcNode.body ? extractFunctionCalls(funcNode.body) : [];
  const allocs = funcNode.body ? countAllocations(funcNode.body) : { arrays: 0, maps: 0 };

  const timeComplexity = estimateTimeComplexity(nestedLoopDepth, isRecursive, hasBinarySearch);
  const spaceComplexity = estimateSpaceComplexity(isRecursive, allocs.arrays, allocs.maps);

  const smellScore = calculateSmellScore({
    cyclomaticComplexity: cyclomatic,
    cognitiveComplexity: cognitive,
    linesOfCode: loc,
    parameterCount: paramCount,
    nestedLoopDepth,
    functionCallCount: calls.length,
  });

  const riskLevel = cyclomaticToRisk(cyclomatic);
  const issues = getComplexityIssues(cyclomatic, cognitive, loc, paramCount, nestedLoopDepth, calls.length);

  const { line } = sourceFile.getLineAndCharacterOfPosition(funcNode.getStart());

  return {
    functionName,
    filePath,
    relativePath,
    line: line + 1,
    cyclomaticComplexity: cyclomatic,
    cognitiveComplexity: cognitive,
    nestedLoopDepth,
    linesOfCode: loc,
    parameterCount: paramCount,
    codeSmellScore: smellScore,
    riskLevel,
    estimatedTimeComplexity: timeComplexity,
    estimatedSpaceComplexity: spaceComplexity,
    issues,
  };
}

/**
 * Complexity calculation utilities — scores, thresholds, and risk level mapping.
 */

import { RiskLevel, ComplexityClass } from '../models/types';
import { COMPLEXITY_THRESHOLDS, SMELL_SCORE_WEIGHTS } from '../config/constants';

// ─── Risk Level Mapping ───────────────────────────────────────────────────────

export function cyclomaticToRisk(complexity: number): RiskLevel {
  if (complexity <= COMPLEXITY_THRESHOLDS.cyclomatic.low) {return RiskLevel.Low;}
  if (complexity <= COMPLEXITY_THRESHOLDS.cyclomatic.medium) {return RiskLevel.Medium;}
  if (complexity <= COMPLEXITY_THRESHOLDS.cyclomatic.high) {return RiskLevel.High;}
  return RiskLevel.Critical;
}

export function cognitiveToRisk(complexity: number): RiskLevel {
  if (complexity <= COMPLEXITY_THRESHOLDS.cognitive.low) {return RiskLevel.Low;}
  if (complexity <= COMPLEXITY_THRESHOLDS.cognitive.medium) {return RiskLevel.Medium;}
  if (complexity <= COMPLEXITY_THRESHOLDS.cognitive.high) {return RiskLevel.High;}
  return RiskLevel.Critical;
}

export function overallRiskLevel(cyclomatic: number, cognitive: number, loc: number, params: number): RiskLevel {
  const levels = [
    cyclomaticToRisk(cyclomatic),
    cognitiveToRisk(cognitive),
  ];
  if (loc > COMPLEXITY_THRESHOLDS.linesOfCode.veryLongFunction) {levels.push(RiskLevel.High);}
  if (params > COMPLEXITY_THRESHOLDS.parameterCount.critical) {levels.push(RiskLevel.High);}

  const scoreMap = { [RiskLevel.Low]: 0, [RiskLevel.Medium]: 1, [RiskLevel.High]: 2, [RiskLevel.Critical]: 3 };
  const max = Math.max(...levels.map(l => scoreMap[l]));
  return [RiskLevel.Low, RiskLevel.Medium, RiskLevel.High, RiskLevel.Critical][max];
}

// ─── Code Smell Score (0–100) ─────────────────────────────────────────────────

export interface SmellInputs {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  parameterCount: number;
  nestedLoopDepth: number;
  functionCallCount: number;
}

/**
 * Calculate a composite code smell score from 0 (clean) to 100 (very smelly).
 * Each dimension is normalized to 0–1 before being weighted.
 */
export function calculateSmellScore(inputs: SmellInputs): number {
  const normalize = (value: number, max: number) => Math.min(value / max, 1);

  const cyclomaticScore = normalize(inputs.cyclomaticComplexity, 30);
  const cognitiveScore  = normalize(inputs.cognitiveComplexity,  30);
  const locScore        = normalize(inputs.linesOfCode,          150);
  const paramScore      = normalize(inputs.parameterCount,       8);
  const nestedScore     = normalize(inputs.nestedLoopDepth,      4);
  const callScore       = normalize(inputs.functionCallCount,    20);

  const weighted =
    cyclomaticScore * SMELL_SCORE_WEIGHTS.cyclomaticComplexity +
    cognitiveScore  * SMELL_SCORE_WEIGHTS.cognitiveComplexity  +
    locScore        * SMELL_SCORE_WEIGHTS.linesOfCode          +
    paramScore      * SMELL_SCORE_WEIGHTS.parameterCount       +
    nestedScore     * SMELL_SCORE_WEIGHTS.nestedLoopDepth      +
    callScore       * SMELL_SCORE_WEIGHTS.functionCallCount;

  return Math.round(weighted * 100);
}

export function smellScoreToRisk(score: number): RiskLevel {
  if (score <= 20) {return RiskLevel.Low;}
  if (score <= 50) {return RiskLevel.Medium;}
  if (score <= 80) {return RiskLevel.High;}
  return RiskLevel.Critical;
}

// ─── Time / Space Complexity Estimation ───────────────────────────────────────

export function estimateTimeComplexity(
  nestedLoopDepth: number,
  hasRecursion: boolean,
  hasBinarySearchPattern: boolean,
): ComplexityClass {
  if (hasRecursion) {return ComplexityClass.Unknown;}
  if (hasBinarySearchPattern) {return ComplexityClass.Logarithmic;}
  switch (nestedLoopDepth) {
    case 0: return ComplexityClass.Constant;
    case 1: return ComplexityClass.Linear;
    case 2: return ComplexityClass.Quadratic;
    default: return ComplexityClass.Cubic;
  }
}

export function estimateSpaceComplexity(
  hasRecursion: boolean,
  arrayAllocations: number,
  mapAllocations: number,
): ComplexityClass {
  if (hasRecursion) {return ComplexityClass.Linear;}
  const allocations = arrayAllocations + mapAllocations;
  if (allocations === 0) {return ComplexityClass.Constant;}
  if (allocations <= 2) {return ComplexityClass.Linear;}
  return ComplexityClass.Quadratic;
}

// ─── Cognitive Complexity ─────────────────────────────────────────────────────

/**
 * Cognitive complexity penalizes nesting more heavily than cyclomatic complexity.
 * Each increment-causing node gets a penalty = 1 + nesting depth.
 */
export function calculateCognitiveComplexityFromNodes(
  breakPoints: Array<{ nestingDepth: number }>,
): number {
  return breakPoints.reduce((total, bp) => total + 1 + bp.nestingDepth, 0);
}

// ─── Display Helpers ──────────────────────────────────────────────────────────

export function riskLevelToEmoji(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.Low: return '🟢';
    case RiskLevel.Medium: return '🟡';
    case RiskLevel.High: return '🟠';
    case RiskLevel.Critical: return '🔴';
  }
}

export function riskLevelToColor(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.Low: return '#22c55e';
    case RiskLevel.Medium: return '#eab308';
    case RiskLevel.High: return '#f97316';
    case RiskLevel.Critical: return '#ef4444';
  }
}

export function getComplexityIssues(
  cyclomatic: number,
  cognitive: number,
  loc: number,
  params: number,
  nestedDepth: number,
  callCount: number,
): string[] {
  const issues: string[] = [];
  if (cyclomatic > COMPLEXITY_THRESHOLDS.cyclomatic.high) {
    issues.push(`High cyclomatic complexity (${cyclomatic})`);
  }
  if (cognitive > COMPLEXITY_THRESHOLDS.cognitive.high) {
    issues.push(`High cognitive complexity (${cognitive})`);
  }
  if (nestedDepth >= COMPLEXITY_THRESHOLDS.nestedLoopDepth.critical) {
    issues.push(`Deeply nested loops (depth: ${nestedDepth})`);
  }
  if (params > COMPLEXITY_THRESHOLDS.parameterCount.critical) {
    issues.push(`Too many parameters (${params})`);
  }
  if (loc > COMPLEXITY_THRESHOLDS.linesOfCode.longFunction) {
    issues.push(`Function too long (${loc} lines)`);
  }
  if (callCount > 15) {
    issues.push(`High coupling — ${callCount} function calls`);
  }
  return issues;
}

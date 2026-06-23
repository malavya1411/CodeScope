/**
 * Complexity calculation utilities — scores, thresholds, and risk level mapping.
 */
import { RiskLevel, ComplexityClass } from '../models/types';
export declare function cyclomaticToRisk(complexity: number): RiskLevel;
export declare function cognitiveToRisk(complexity: number): RiskLevel;
export declare function overallRiskLevel(cyclomatic: number, cognitive: number, loc: number, params: number): RiskLevel;
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
export declare function calculateSmellScore(inputs: SmellInputs): number;
export declare function smellScoreToRisk(score: number): RiskLevel;
export declare function estimateTimeComplexity(nestedLoopDepth: number, hasRecursion: boolean, hasBinarySearchPattern: boolean): ComplexityClass;
export declare function estimateSpaceComplexity(hasRecursion: boolean, arrayAllocations: number, mapAllocations: number): ComplexityClass;
/**
 * Cognitive complexity penalizes nesting more heavily than cyclomatic complexity.
 * Each increment-causing node gets a penalty = 1 + nesting depth.
 */
export declare function calculateCognitiveComplexityFromNodes(breakPoints: Array<{
    nestingDepth: number;
}>): number;
export declare function riskLevelToEmoji(level: RiskLevel): string;
export declare function riskLevelToColor(level: RiskLevel): string;
export declare function getComplexityIssues(cyclomatic: number, cognitive: number, loc: number, params: number, nestedDepth: number, callCount: number): string[];
//# sourceMappingURL=complexity.d.ts.map
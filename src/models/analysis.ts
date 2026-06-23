/**
 * Analysis result wrapper types — used to communicate results between
 * the extension host and the webview UI.
 */

import { FileAnalysis, ProjectAnalysis, VariableTrackResult, RiskLevel, ComplexityClass } from './types';
import { CallHierarchyResult, FlowAnalysisResult, DependencyGraph, CircularDependency } from './graph';

// ─── Analysis Status ──────────────────────────────────────────────────────────

export enum AnalysisStatus {
  Idle = 'idle',
  Running = 'running',
  Complete = 'complete',
  Error = 'error',
  Cancelled = 'cancelled',
}

export interface AnalysisProgress {
  status: AnalysisStatus;
  message: string;
  current: number;
  total: number;
  percentage: number;
}

// ─── Generic Result Wrapper ───────────────────────────────────────────────────

export interface AnalysisResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;  // ms
  timestamp: number;
}

// ─── Specific Result Types ────────────────────────────────────────────────────

export type FileAnalysisResult = AnalysisResult<FileAnalysis>;
export type ProjectAnalysisResult = AnalysisResult<ProjectAnalysis>;
export type VariableTrackAnalysisResult = AnalysisResult<VariableTrackResult>;
export type CallHierarchyAnalysisResult = AnalysisResult<CallHierarchyResult>;
export type FlowAnalysisResultWrapper = AnalysisResult<FlowAnalysisResult>;

// ─── Complexity Report ────────────────────────────────────────────────────────

export interface ComplexityEntry {
  functionName: string;
  filePath: string;
  relativePath: string;
  line: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestedLoopDepth: number;
  linesOfCode: number;
  parameterCount: number;
  codeSmellScore: number;
  riskLevel: RiskLevel;
  estimatedTimeComplexity: ComplexityClass;
  estimatedSpaceComplexity: ComplexityClass;
  issues: string[];
}

export interface ComplexityReport {
  projectPath: string;
  totalFunctions: number;
  averageCyclomatic: number;
  averageCognitive: number;
  maxCyclomatic: number;
  maxCognitive: number;
  riskDistribution: Record<RiskLevel, number>;
  topComplexFunctions: ComplexityEntry[];
  allEntries: ComplexityEntry[];
  generatedAt: number;
}

// ─── Heatmap Data ─────────────────────────────────────────────────────────────

export enum HeatmapMetric {
  Complexity = 'complexity',
  Imports = 'imports',
  Dependents = 'dependents',
  Size = 'size',
  SmellScore = 'smellScore',
}

export interface HeatmapNode {
  id: string;
  name: string;
  relativePath: string;
  value: number;
  normalizedValue: number;  // 0–1
  riskLevel: RiskLevel;
  children?: HeatmapNode[];
  isDirectory: boolean;
}

export interface HeatmapData {
  metric: HeatmapMetric;
  root: HeatmapNode;
  minValue: number;
  maxValue: number;
  totalFiles: number;
  generatedAt: number;
}

// ─── Dependency Report ────────────────────────────────────────────────────────

export interface DependencyReport {
  projectPath: string;
  graph: DependencyGraph;
  circularDependencies: CircularDependency[];
  unusedExports: UnusedExport[];
  mostImported: ImportedFileEntry[];
  mostImporting: ImportingFileEntry[];
  generatedAt: number;
}

export interface UnusedExport {
  filePath: string;
  exportName: string;
  line: number;
}

export interface ImportedFileEntry {
  filePath: string;
  relativePath: string;
  importCount: number;  // in-degree
}

export interface ImportingFileEntry {
  filePath: string;
  relativePath: string;
  dependencyCount: number;  // out-degree
}

// ─── Webview Messages ─────────────────────────────────────────────────────────

export type WebviewMessageType =
  | 'analyzeFile'
  | 'analyzeProject'
  | 'getDependencyGraph'
  | 'getComplexityReport'
  | 'trackVariable'
  | 'getCallHierarchy'
  | 'getExecutionFlow'
  | 'getHeatmap'
  | 'navigateToFile'
  | 'refresh'
  | 'ready';

export interface WebviewMessage<T = unknown> {
  type: WebviewMessageType;
  payload?: T;
  requestId?: string;
}

export type ExtensionMessageType =
  | 'fileAnalysisResult'
  | 'projectAnalysisResult'
  | 'dependencyGraphResult'
  | 'complexityReportResult'
  | 'variableTrackResult'
  | 'callHierarchyResult'
  | 'executionFlowResult'
  | 'heatmapResult'
  | 'progress'
  | 'error'
  | 'themeChanged';

export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload?: T;
  requestId?: string;
  error?: string;
}

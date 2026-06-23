/**
 * Core TypeScript interfaces and enums for CodeScope.
 * All analysis results and data structures are typed here.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum LanguageId {
  TypeScript = 'typescript',
  TypeScriptReact = 'typescriptreact',
  JavaScript = 'javascript',
  JavaScriptReact = 'javascriptreact',
  Unknown = 'unknown',
}

export enum FileRole {
  Component = 'component',
  Service = 'service',
  Hook = 'hook',
  Utility = 'utility',
  Type = 'type',
  Config = 'config',
  Test = 'test',
  Route = 'route',
  Controller = 'controller',
  Model = 'model',
  Unknown = 'unknown',
}

export enum ArchitectureLayer {
  Frontend = 'frontend',
  API = 'api',
  Service = 'service',
  Data = 'data',
  Utility = 'utility',
  Configuration = 'configuration',
  Test = 'test',
  Unknown = 'unknown',
}

export enum RiskLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum ComplexityClass {
  Constant = 'O(1)',
  Logarithmic = 'O(log n)',
  Linear = 'O(n)',
  NLogN = 'O(n log n)',
  Quadratic = 'O(n²)',
  Cubic = 'O(n³)',
  Exponential = 'O(2ⁿ)',
  Factorial = 'O(n!)',
  Unknown = 'O(?)',
}

export enum NodeKind {
  Function = 'function',
  Method = 'method',
  ArrowFunction = 'arrowFunction',
  Constructor = 'constructor',
}

export enum VariableKind {
  Const = 'const',
  Let = 'let',
  Var = 'var',
  Parameter = 'parameter',
}

export enum ReferenceKind {
  Declaration = 'declaration',
  Assignment = 'assignment',
  Read = 'read',
  Modification = 'modification',
}

// ─── Location ────────────────────────────────────────────────────────────────

export interface Location {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

// ─── Import / Export ─────────────────────────────────────────────────────────

export interface ImportInfo {
  source: string;           // raw import path
  resolvedPath: string | null; // absolute resolved path
  specifiers: string[];     // imported names ['useState', 'useEffect']
  isDefault: boolean;
  isNamespace: boolean;     // import * as X
  isDynamic: boolean;       // import()
  location: Location;
}

export interface ExportInfo {
  name: string;
  isDefault: boolean;
  isReexport: boolean;
  sourceModule?: string;    // for re-exports
  kind: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'enum' | 'unknown';
  location: Location;
}

// ─── Parameters ──────────────────────────────────────────────────────────────

export interface ParameterInfo {
  name: string;
  type: string;
  isOptional: boolean;
  hasDefault: boolean;
  defaultValue?: string;
  isRest: boolean;
}

// ─── Function Analysis ───────────────────────────────────────────────────────

export interface FunctionAnalysis {
  id: string;
  name: string;
  kind: NodeKind;
  parameters: ParameterInfo[];
  returnType: string;
  genericParams: string[];
  linesOfCode: number;
  totalLines: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestedLoopDepth: number;
  estimatedTimeComplexity: ComplexityClass;
  estimatedSpaceComplexity: ComplexityClass;
  codeSmellScore: number;
  riskLevel: RiskLevel;
  functionCalls: FunctionCallInfo[];
  isExported: boolean;
  isAsync: boolean;
  isRecursive: boolean;
  jsdoc?: string;
  location: Location;
}

export interface FunctionCallInfo {
  name: string;
  isInternal: boolean;
  sourceModule?: string;
  location: Location;
}

// ─── Class Analysis ──────────────────────────────────────────────────────────

export interface ClassAnalysis {
  id: string;
  name: string;
  baseClass?: string;
  interfaces: string[];
  decorators: string[];
  methods: FunctionAnalysis[];
  properties: PropertyInfo[];
  isAbstract: boolean;
  isExported: boolean;
  location: Location;
}

export interface PropertyInfo {
  name: string;
  type: string;
  isStatic: boolean;
  isReadonly: boolean;
  isOptional: boolean;
  visibility: 'public' | 'private' | 'protected';
  decorators: string[];
  location: Location;
}

// ─── Variable Tracking ───────────────────────────────────────────────────────

export interface VariableReference {
  kind: ReferenceKind;
  location: Location;
  snippet: string;
  containingFunction?: string;
}

export interface VariableTrackResult {
  name: string;
  variableKind: VariableKind;
  type: string;
  declaration: VariableReference;
  assignments: VariableReference[];
  reads: VariableReference[];
  modifications: VariableReference[];
  usedInFunctions: string[];
  issues: string[];
}

// ─── File Analysis ───────────────────────────────────────────────────────────

export interface FileMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  functionCount: number;
  classCount: number;
  importCount: number;
  exportCount: number;
  averageComplexity: number;
  maxComplexity: number;
  highRiskFunctionCount: number;
}

export interface FileAnalysis {
  id: string;
  filePath: string;
  relativePath: string;
  language: LanguageId;
  role: FileRole;
  purpose: string;
  layer: ArchitectureLayer;
  imports: ImportInfo[];
  exports: ExportInfo[];
  functions: FunctionAnalysis[];
  classes: ClassAnalysis[];
  variables: VariableInfo[];
  metrics: FileMetrics;
  analysisTime: number;
  timestamp: number;
  error?: string;
}

export interface VariableInfo {
  name: string;
  kind: VariableKind;
  type: string;
  isExported: boolean;
  location: Location;
}

// ─── Project Analysis ────────────────────────────────────────────────────────

export interface ProjectType {
  name: string;            // 'React + TypeScript + Vite Application'
  framework: string;       // 'react', 'vue', 'angular', 'express', 'next', ...
  language: string;        // 'typescript', 'javascript'
  buildTool: string;       // 'vite', 'webpack', 'esbuild', ...
  testFramework: string;   // 'jest', 'vitest', 'mocha', ...
}

export interface EntryPoint {
  filePath: string;
  relativePath: string;
  kind: 'main' | 'page' | 'route' | 'test' | 'config';
}

export interface FolderMetrics {
  path: string;
  relativePath: string;
  fileCount: number;
  totalLines: number;
  averageComplexity: number;
  children: FolderMetrics[];
}

export interface ProjectMetrics {
  totalFiles: number;
  totalLines: number;
  totalFunctions: number;
  totalClasses: number;
  averageComplexity: number;
  highRiskFiles: number;
  circularDependencies: number;
  unusedExports: number;
  languageDistribution: Record<string, number>;
}

export interface ProjectAnalysis {
  name: string;
  rootPath: string;
  projectType: ProjectType;
  entryPoints: EntryPoint[];
  folderTree: FolderMetrics;
  metrics: ProjectMetrics;
  files: FileAnalysis[];
  suggestedReadingOrder: ReadingOrderEntry[];
  architectureLayers: ArchitectureLayerInfo[];
  issues: ProjectIssue[];
  analysisTime: number;
  timestamp: number;
}

export interface ReadingOrderEntry {
  filePath: string;
  relativePath: string;
  category: 'foundation' | 'core' | 'business-logic' | 'ui' | 'entry-point';
  reason: string;
  order: number;
}

export interface ArchitectureLayerInfo {
  layer: ArchitectureLayer;
  displayName: string;
  files: string[];
  fileCount: number;
  totalLines: number;
  dependsOn: ArchitectureLayer[];
  antiPatterns: AntiPattern[];
}

export interface AntiPattern {
  description: string;
  sourceFile: string;
  targetFile: string;
  severity: RiskLevel;
}

export interface ProjectIssue {
  type: 'circular-dependency' | 'high-complexity' | 'unused-export' | 'anti-pattern';
  message: string;
  file?: string;
  severity: RiskLevel;
}

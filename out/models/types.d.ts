/**
 * Core TypeScript interfaces and enums for CodeScope.
 * All analysis results and data structures are typed here.
 */
export declare enum LanguageId {
    TypeScript = "typescript",
    TypeScriptReact = "typescriptreact",
    JavaScript = "javascript",
    JavaScriptReact = "javascriptreact",
    Unknown = "unknown"
}
export declare enum FileRole {
    Component = "component",
    Service = "service",
    Hook = "hook",
    Utility = "utility",
    Type = "type",
    Config = "config",
    Test = "test",
    Route = "route",
    Controller = "controller",
    Model = "model",
    Unknown = "unknown"
}
export declare enum ArchitectureLayer {
    Frontend = "frontend",
    API = "api",
    Service = "service",
    Data = "data",
    Utility = "utility",
    Configuration = "configuration",
    Test = "test",
    Unknown = "unknown"
}
export declare enum RiskLevel {
    Low = "low",
    Medium = "medium",
    High = "high",
    Critical = "critical"
}
export declare enum ComplexityClass {
    Constant = "O(1)",
    Logarithmic = "O(log n)",
    Linear = "O(n)",
    NLogN = "O(n log n)",
    Quadratic = "O(n\u00B2)",
    Cubic = "O(n\u00B3)",
    Exponential = "O(2\u207F)",
    Factorial = "O(n!)",
    Unknown = "O(?)"
}
export declare enum NodeKind {
    Function = "function",
    Method = "method",
    ArrowFunction = "arrowFunction",
    Constructor = "constructor"
}
export declare enum VariableKind {
    Const = "const",
    Let = "let",
    Var = "var",
    Parameter = "parameter"
}
export declare enum ReferenceKind {
    Declaration = "declaration",
    Assignment = "assignment",
    Read = "read",
    Modification = "modification"
}
export interface Location {
    file: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
}
export interface ImportInfo {
    source: string;
    resolvedPath: string | null;
    specifiers: string[];
    isDefault: boolean;
    isNamespace: boolean;
    isDynamic: boolean;
    location: Location;
}
export interface ExportInfo {
    name: string;
    isDefault: boolean;
    isReexport: boolean;
    sourceModule?: string;
    kind: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'enum' | 'unknown';
    location: Location;
}
export interface ParameterInfo {
    name: string;
    type: string;
    isOptional: boolean;
    hasDefault: boolean;
    defaultValue?: string;
    isRest: boolean;
}
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
export interface ProjectType {
    name: string;
    framework: string;
    language: string;
    buildTool: string;
    testFramework: string;
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
//# sourceMappingURL=types.d.ts.map
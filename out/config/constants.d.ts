/**
 * Extension-wide constants, thresholds, and default values.
 */
export declare const EXTENSION_ID = "codescope";
export declare const EXTENSION_DISPLAY_NAME = "CodeScope";
export declare const SUPPORTED_EXTENSIONS: Set<string>;
export declare const TYPESCRIPT_EXTENSIONS: Set<string>;
export declare const JAVASCRIPT_EXTENSIONS: Set<string>;
export declare const DEFAULT_EXCLUDE_PATTERNS: string[];
export declare const COMPLEXITY_THRESHOLDS: {
    readonly cyclomatic: {
        readonly low: 5;
        readonly medium: 10;
        readonly high: 20;
        readonly critical: 30;
    };
    readonly cognitive: {
        readonly low: 5;
        readonly medium: 10;
        readonly high: 20;
        readonly critical: 30;
    };
    readonly nestedLoopDepth: {
        readonly warning: 2;
        readonly critical: 3;
    };
    readonly linesOfCode: {
        readonly longFunction: 50;
        readonly veryLongFunction: 100;
    };
    readonly parameterCount: {
        readonly warning: 4;
        readonly critical: 6;
    };
};
export declare const SMELL_SCORE_WEIGHTS: {
    readonly cyclomaticComplexity: 0.3;
    readonly cognitiveComplexity: 0.25;
    readonly linesOfCode: 0.2;
    readonly parameterCount: 0.1;
    readonly nestedLoopDepth: 0.1;
    readonly functionCallCount: 0.05;
};
export declare const CACHE_DEFAULTS: {
    readonly maxEntries: 1000;
    readonly ttlMs: number;
    readonly fileCacheSize: 500;
};
export declare const ANALYSIS_LIMITS: {
    readonly maxFilesPerProject: 5000;
    readonly maxFileSizeBytes: number;
    readonly debounceMs: 500;
    readonly maxCallHierarchyDepth: 10;
    readonly maxGraphNodes: 2000;
};
export declare const LAYER_PATTERNS: {
    readonly frontend: {
        readonly folders: readonly ["components", "pages", "views", "ui", "screens", "layouts", "containers"];
        readonly imports: readonly ["react", "vue", "@angular", "svelte"];
        readonly extensions: readonly [".tsx", ".jsx", ".vue", ".svelte"];
    };
    readonly api: {
        readonly folders: readonly ["api", "routes", "controllers", "handlers", "endpoints", "middleware"];
        readonly imports: readonly ["express", "fastify", "hapi", "@nestjs", "koa", "restify"];
        readonly extensions: readonly [];
    };
    readonly service: {
        readonly folders: readonly ["services", "useCases", "domain", "use-cases", "business"];
        readonly imports: readonly [];
        readonly extensions: readonly [];
    };
    readonly data: {
        readonly folders: readonly ["models", "entities", "repositories", "db", "database", "schemas", "dao"];
        readonly imports: readonly ["prisma", "typeorm", "sequelize", "mongoose", "knex", "drizzle-orm"];
        readonly extensions: readonly [];
    };
    readonly utility: {
        readonly folders: readonly ["utils", "utilities", "helpers", "lib", "shared", "common"];
        readonly imports: readonly [];
        readonly extensions: readonly [];
    };
    readonly configuration: {
        readonly folders: readonly ["config", "configuration", "constants", "settings", "env"];
        readonly imports: readonly [];
        readonly extensions: readonly [];
    };
    readonly test: {
        readonly folders: readonly ["test", "tests", "__tests__", "spec", "specs", "e2e", "__mocks__"];
        readonly imports: readonly ["jest", "vitest", "mocha", "jasmine", "@testing-library"];
        readonly extensions: readonly [];
        readonly patterns: readonly ["*.test.*", "*.spec.*"];
    };
};
export declare const FILE_ROLE_PATTERNS: {
    readonly component: {
        readonly suffixes: readonly ["Component", "View", "Screen", "Page", "Layout"];
        readonly extensions: readonly [".tsx", ".jsx"];
    };
    readonly service: {
        readonly suffixes: readonly ["Service", "Manager", "Handler", "Provider"];
        readonly extensions: readonly [];
    };
    readonly hook: {
        readonly prefixes: readonly ["use"];
        readonly extensions: readonly [".ts", ".tsx"];
    };
    readonly utility: {
        readonly folders: readonly ["utils", "helpers", "lib"];
        readonly extensions: readonly [];
    };
    readonly type: {
        readonly folders: readonly ["types", "interfaces", "models"];
        readonly extensions: readonly [".d.ts"];
    };
    readonly config: {
        readonly folders: readonly ["config", "constants"];
        readonly extensions: readonly [];
    };
    readonly test: {
        readonly patterns: readonly [".test.", ".spec.", "__tests__"];
        readonly extensions: readonly [];
    };
    readonly route: {
        readonly suffixes: readonly ["Route", "Router", "Routes"];
        readonly folders: readonly ["routes", "api"];
    };
    readonly controller: {
        readonly suffixes: readonly ["Controller"];
        readonly folders: readonly ["controllers"];
    };
    readonly model: {
        readonly suffixes: readonly ["Model", "Entity", "Schema"];
        readonly folders: readonly ["models", "entities"];
    };
};
export declare const PANEL_IDS: {
    readonly dashboard: "codescope.dashboard";
    readonly flowViewer: "codescope.flowViewer";
    readonly dependencyGraph: "codescope.dependencyGraph";
    readonly complexityReport: "codescope.complexityReport";
};
export declare const COMMANDS: {
    readonly analyzeFile: "codescope.analyzeFile";
    readonly analyzeProject: "codescope.analyzeProject";
    readonly dependencyGraph: "codescope.dependencyGraph";
    readonly complexityAnalysis: "codescope.complexityAnalysis";
    readonly showDashboard: "codescope.showDashboard";
    readonly trackVariable: "codescope.trackVariable";
    readonly showCallHierarchy: "codescope.showCallHierarchy";
    readonly showExecutionFlow: "codescope.showExecutionFlow";
};
//# sourceMappingURL=constants.d.ts.map
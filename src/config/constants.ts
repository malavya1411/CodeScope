/**
 * Extension-wide constants, thresholds, and default values.
 */

// ─── Extension Identity ───────────────────────────────────────────────────────

export const EXTENSION_ID = 'codescope';
export const EXTENSION_DISPLAY_NAME = 'CodeScope';

// ─── Supported Languages ──────────────────────────────────────────────────────

export const SUPPORTED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts',
]);

export const TYPESCRIPT_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);
export const JAVASCRIPT_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);

// ─── Default Exclusion Patterns ───────────────────────────────────────────────

export const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.git/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/vendor/**',
];

// ─── Complexity Thresholds ────────────────────────────────────────────────────

export const COMPLEXITY_THRESHOLDS = {
  cyclomatic: {
    low: 5,
    medium: 10,
    high: 20,
    critical: 30,
  },
  cognitive: {
    low: 5,
    medium: 10,
    high: 20,
    critical: 30,
  },
  nestedLoopDepth: {
    warning: 2,
    critical: 3,
  },
  linesOfCode: {
    longFunction: 50,
    veryLongFunction: 100,
  },
  parameterCount: {
    warning: 4,
    critical: 6,
  },
} as const;

// ─── Code Smell Score Weights ─────────────────────────────────────────────────

export const SMELL_SCORE_WEIGHTS = {
  cyclomaticComplexity: 0.30,
  cognitiveComplexity: 0.25,
  linesOfCode: 0.20,
  parameterCount: 0.10,
  nestedLoopDepth: 0.10,
  functionCallCount: 0.05,
} as const;

// ─── Cache Settings ───────────────────────────────────────────────────────────

export const CACHE_DEFAULTS = {
  maxEntries: 1000,
  ttlMs: 5 * 60 * 1000,   // 5 minutes
  fileCacheSize: 500,
} as const;

// ─── Analysis Limits ──────────────────────────────────────────────────────────

export const ANALYSIS_LIMITS = {
  maxFilesPerProject: 5000,
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  debounceMs: 500,
  maxCallHierarchyDepth: 10,
  maxGraphNodes: 2000,
} as const;

// ─── Layer Detection Patterns ─────────────────────────────────────────────────

export const LAYER_PATTERNS = {
  frontend: {
    folders: ['components', 'pages', 'views', 'ui', 'screens', 'layouts', 'containers'],
    imports: ['react', 'vue', '@angular', 'svelte'],
    extensions: ['.tsx', '.jsx', '.vue', '.svelte'],
  },
  api: {
    folders: ['api', 'routes', 'controllers', 'handlers', 'endpoints', 'middleware'],
    imports: ['express', 'fastify', 'hapi', '@nestjs', 'koa', 'restify'],
    extensions: [],
  },
  service: {
    folders: ['services', 'useCases', 'domain', 'use-cases', 'business'],
    imports: [],
    extensions: [],
  },
  data: {
    folders: ['models', 'entities', 'repositories', 'db', 'database', 'schemas', 'dao'],
    imports: ['prisma', 'typeorm', 'sequelize', 'mongoose', 'knex', 'drizzle-orm'],
    extensions: [],
  },
  utility: {
    folders: ['utils', 'utilities', 'helpers', 'lib', 'shared', 'common'],
    imports: [],
    extensions: [],
  },
  configuration: {
    folders: ['config', 'configuration', 'constants', 'settings', 'env'],
    imports: [],
    extensions: [],
  },
  test: {
    folders: ['test', 'tests', '__tests__', 'spec', 'specs', 'e2e', '__mocks__'],
    imports: ['jest', 'vitest', 'mocha', 'jasmine', '@testing-library'],
    extensions: [],
    patterns: ['*.test.*', '*.spec.*'],
  },
} as const;

// ─── File Role Detection ──────────────────────────────────────────────────────

export const FILE_ROLE_PATTERNS = {
  component: { suffixes: ['Component', 'View', 'Screen', 'Page', 'Layout'], extensions: ['.tsx', '.jsx'] },
  service: { suffixes: ['Service', 'Manager', 'Handler', 'Provider'], extensions: [] },
  hook: { prefixes: ['use'], extensions: ['.ts', '.tsx'] },
  utility: { folders: ['utils', 'helpers', 'lib'], extensions: [] },
  type: { folders: ['types', 'interfaces', 'models'], extensions: ['.d.ts'] },
  config: { folders: ['config', 'constants'], extensions: [] },
  test: { patterns: ['.test.', '.spec.', '__tests__'], extensions: [] },
  route: { suffixes: ['Route', 'Router', 'Routes'], folders: ['routes', 'api'] },
  controller: { suffixes: ['Controller'], folders: ['controllers'] },
  model: { suffixes: ['Model', 'Entity', 'Schema'], folders: ['models', 'entities'] },
} as const;

// ─── Webview Panel IDs ────────────────────────────────────────────────────────

export const PANEL_IDS = {
  dashboard: 'codescope.dashboard',
  flowViewer: 'codescope.flowViewer',
  dependencyGraph: 'codescope.dependencyGraph',
  complexityReport: 'codescope.complexityReport',
} as const;

// ─── VSCode Command IDs ───────────────────────────────────────────────────────

export const COMMANDS = {
  analyzeFile: 'codescope.analyzeFile',
  analyzeProject: 'codescope.analyzeProject',
  dependencyGraph: 'codescope.dependencyGraph',
  complexityAnalysis: 'codescope.complexityAnalysis',
  showDashboard: 'codescope.showDashboard',
  trackVariable: 'codescope.trackVariable',
  showCallHierarchy: 'codescope.showCallHierarchy',
  showExecutionFlow: 'codescope.showExecutionFlow',
} as const;

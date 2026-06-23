# Prompt: CodeScope — Offline Developer Intelligence VS Code Extension

> **Target**: AntiGravity (or any AI coding assistant)
> **Scope**: Build a production-ready VS Code Extension
> **Constraint**: Zero AI / Zero LLM / Fully Offline

---

## 1. Executive Summary

This prompt is specifically designed to build a **Code Explainer VS Code Extension without any AI or LLM integration**. The entire system must rely exclusively on:

- **AST Parsing** — structural code understanding
- **Static Analysis** — rule-based code inspection
- **Dependency Graphs** — module and symbol relationships
- **Rule-Based Explanations** — deterministic, explainable output

No neural networks. No API calls. No cloud dependencies. Everything runs locally.

---

## 2. Product Name & Identity

**Name**: `CodeScope`

**Tagline**: *Understand any codebase — no AI required.*

**Category**: Developer Intelligence & Onboarding Tool

**Differentiator**: While tools like GitHub Copilot, ChatGPT, Cursor, and Codeium rely on large language models, CodeScope is a deterministic, fully offline alternative that uses classical computer science techniques to help developers understand unfamiliar codebases.

---

## 3. Vision & Philosophy

### 3.1 Core Philosophy

CodeScope is a **developer intelligence and onboarding tool** built on the principle that code understanding should be:

- **Deterministic** — same input always produces same output
- **Explainable** — every insight has a traceable origin in the code
- **Privacy-preserving** — no code ever leaves the developer's machine
- **Fast** — no network latency, no model loading
- **Reliable** — no hallucinations, no invented APIs, no false confidence

### 3.2 What CodeScope Does NOT Do

- ❌ Generate code suggestions
- ❌ Write new functions
- ❌ Refactor code automatically
- ❌ Use any AI, ML, or LLM models
- ❌ Make API calls to external services
- ❌ Send code to the cloud

### 3.3 What CodeScope DOES Do

- ✅ Parse Abstract Syntax Trees (AST)
- ✅ Perform static code analysis
- ✅ Analyze dependencies between modules
- ✅ Calculate cyclomatic and cognitive complexity
- ✅ Resolve symbols and track variable usage
- ✅ Map execution flow and call hierarchies
- ✅ Generate interactive visualizations
- ✅ Provide structured, data-driven explanations

---

## 4. Core Goal

When a developer opens a file or repository, CodeScope should answer the following questions **without any AI**:

| Question | How CodeScope Answers |
|----------|----------------------|
| *"What does this file do?"* | Purpose inference from exports, class names, function names, and JSDoc/TSDoc comments |
| *"How does execution flow?"* | Interactive flowchart generated from AST control flow analysis |
| *"Which functions are important?"* | Ranking by: call frequency, complexity score, export status, centrality in dependency graph |
| *"What depends on what?"* | Import/export graph with bidirectional navigation |
| *"Where should I start reading?"* | Suggested reading order based on entry points and dependency topology |
| *"What is the complexity?"* | Cyclomatic complexity, nested loop depth, estimated Big-O analysis |
| *"How is the project structured?"* | Auto-detected architecture layers and folder hierarchy visualization |

---

## 5. Technology Stack

### 5.1 Extension Layer

| Technology | Purpose |
|-----------|---------|
| **VS Code Extension API** | Core extension lifecycle, commands, webview panels, file system access |
| **TypeScript** | Type-safe development, AST manipulation, static analysis |

### 5.2 User Interface Layer

| Technology | Purpose |
|-----------|---------|
| **React 18+** | Component-based UI architecture |
| **Vite** | Fast development builds and optimized production bundling |
| **Tailwind CSS** | Utility-first styling with VS Code theme integration |

### 5.3 Analysis Engine Layer

| Technology | Purpose |
|-----------|---------|
| **TypeScript Compiler API** | Native TS AST parsing, type checking, symbol resolution |
| **ts-morph** | High-level AST manipulation and code transformation |
| **Babel Parser** | Multi-language AST parsing (JS, TS, JSX, TSX, with plugin extensibility) |
| **ESLint AST utilities** | Additional AST traversal helpers and rule patterns |

### 5.4 Visualization Layer

| Technology | Purpose |
|-----------|---------|
| **React Flow** | Interactive node-based diagrams (execution flow, call hierarchy) |
| **D3.js** | Custom data visualizations (dependency graphs, heatmaps, architecture diagrams) |

---

## 6. Architecture

```
codescope/
├── src/
│   ├── extension.ts                    # Extension entry point, activation, disposal
│   │
│   ├── commands/                       # VS Code command handlers
│   │   ├── analyzeFile.ts              # "Analyze Current File" command
│   │   ├── analyzeProject.ts           # "Analyze Repository" command
│   │   ├── dependencyGraph.ts          # "Show Dependency Graph" command
│   │   ├── complexityAnalysis.ts       # "Show Complexity Report" command
│   │   └── showDashboard.ts            # "Open Dashboard" command
│   │
│   ├── analyzers/                      # Core analysis engines
│   │   ├── astAnalyzer.ts              # Generic AST parsing and traversal
│   │   ├── functionAnalyzer.ts         # Function-level analysis (params, returns, calls)
│   │   ├── classAnalyzer.ts            # Class-level analysis (methods, properties, inheritance)
│   │   ├── dependencyAnalyzer.ts       # Import/export resolution and module graph building
│   │   ├── complexityAnalyzer.ts       # Cyclomatic complexity, nested depth, Big-O estimation
│   │   └── flowAnalyzer.ts             # Control flow extraction and flowchart generation
│   │
│   ├── services/                       # Shared business logic
│   │   ├── parserService.ts            # Unified parser facade (TS Compiler, Babel, ts-morph)
│   │   ├── graphService.ts             # Graph data structure operations (DAG, adjacency lists)
│   │   ├── cacheService.ts             # File-level and project-level result caching
│   │   ├── indexService.ts             # Project-wide symbol index for fast lookups
│   │   └── workerService.ts            # Web Worker orchestration for background analysis
│   │
│   ├── panels/                         # Webview panel controllers
│   │   ├── DashboardPanel.ts           # Main dashboard webview panel
│   │   ├── FlowViewerPanel.ts          # Execution flow webview panel
│   │   ├── DependencyGraphPanel.ts     # Dependency graph webview panel
│   │   └── ComplexityPanel.ts          # Complexity report webview panel
│   │
│   ├── models/                         # Data structures and type definitions
│   │   ├── types.ts                    # Core TypeScript interfaces and enums
│   │   ├── graph.ts                    # Graph node/edge type definitions
│   │   └── analysis.ts                 # Analysis result type definitions
│   │
│   ├── utils/                          # Utility functions
│   │   ├── complexity.ts               # Complexity calculation utilities
│   │   ├── naming.ts                   # Naming convention inference (purpose detection)
│   │   ├── fileSystem.ts               # File system helpers (glob, read, watch)
│   │   └── theme.ts                    # VS Code theme CSS variable extraction
│   │
│   └── config/                         # Extension configuration
│       ├── constants.ts                # Magic numbers, default values
│       └── settings.ts                 # VS Code settings schema and defaults
│
├── webview/                            # React frontend (built separately, bundled into extension)
│   ├── src/
│   │   ├── main.tsx                    # React entry point
│   │   ├── App.tsx                     # Root component with routing
│   │   │
│   │   ├── components/               # Reusable UI components
│   │   │   ├── Header.tsx              # Dashboard header with project summary
│   │   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   │   ├── ComplexityCard.tsx      # Complexity metric card component
│   │   │   ├── FileTree.tsx            # Interactive file tree explorer
│   │   │   ├── MetricBadge.tsx         # Small metric display badge
│   │   │   └── ThemeProvider.tsx       # VS Code theme synchronization
│   │   │
│   │   ├── views/                      # Main view pages
│   │   │   ├── DashboardView.tsx       # Main dashboard (overview)
│   │   │   ├── FileAnalysisView.tsx    # Single file analysis view
│   │   │   ├── ProjectOverviewView.tsx # Repository-wide analysis view
│   │   │   ├── FlowViewer.tsx          # Execution flow diagram view
│   │   │   ├── DependencyGraphView.tsx # Interactive dependency graph view
│   │   │   ├── ComplexityReportView.tsx # Complexity analysis report
│   │   │   ├── ArchitectureView.tsx    # Architecture layer diagram
│   │   │   ├── HeatmapView.tsx         # Code heatmap visualization
│   │   │   ├── VariableTrackerView.tsx # Variable usage tracking view
│   │   │   └── CallHierarchyView.tsx   # Call hierarchy tree view
│   │   │
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── useVSCodeTheme.ts       # Sync with VS Code theme changes
│   │   │   ├── useExtensionMessage.ts  # Receive messages from extension host
│   │   │   └── useAnalysisData.ts      # Fetch and cache analysis results
│   │   │
│   │   └── styles/                     # Global styles
│   │       └── index.css               # Tailwind directives + VS Code CSS variables
│   │
│   ├── index.html                      # HTML template
│   ├── vite.config.ts                  # Vite configuration
│   ├── tailwind.config.js              # Tailwind configuration with VS Code theme
│   └── tsconfig.json                   # TypeScript configuration
│
├── media/                              # Static assets (icons, logos)
├── test/                               # Test suites
├── package.json                        # Extension manifest + dependencies
├── tsconfig.json                       # Extension TypeScript config
└── webpack.config.js                   # Extension bundling config
```

---

## 7. Feature Specifications

### Feature 1: Explain Current File

**Command**: `CodeScope: Analyze Current File`

**Trigger**: Command Palette, context menu on file tab, or keyboard shortcut

**Analysis Pipeline**:
1. Parse the active file's AST using the appropriate parser (TS Compiler API for `.ts`/`.tsx`, Babel for `.js`/`.jsx`)
2. Extract top-level declarations: imports, exports, functions, classes, variables, type aliases, interfaces
3. Infer file purpose from:
   - JSDoc/TSDoc `@fileoverview` or module-level comments
   - Export names (e.g., `UserService.ts` exporting `class UserService`)
   - Import patterns (e.g., heavy React imports suggest a component file)
4. Build execution flow from top-level statements and function bodies
5. Calculate basic metrics: total lines, code lines, comment lines, function count, class count

**Output Structure**:

```
┌─────────────────────────────────────┐
│  📄 FileAnalysisView.tsx            │
│  Purpose: React component rendering │
│  the file analysis dashboard panel  │
├─────────────────────────────────────┤
│  📥 IMPORTS (8)                     │
│  • react from 'react'               │
│  • useState, useEffect from 'react' │
│  • FileTree from '../components'    │
│  ...                                │
├─────────────────────────────────────┤
│  📤 EXPORTS (3)                     │
│  • default: FileAnalysisView          │
│  • interface: FileAnalysisProps     │
│  • type: AnalysisMode               │
├─────────────────────────────────────┤
│  ⚙️ FUNCTIONS (5)                   │
│  • FileAnalysisView()               │
│  • handleFileSelect()               │
│  • renderMetrics()                  │
│  • calculateComplexity()            │
│  • exportToJson()                   │
├─────────────────────────────────────┤
│  🏛️ CLASSES (0)                     │
├─────────────────────────────────────┤
│  📦 VARIABLES (4)                   │
│  • const DEFAULT_VIEW = 'overview'  │
│  • let currentFile: string | null   │
│  ...                                │
├─────────────────────────────────────┤
│  🔗 DEPENDENCIES                    │
│  Internal: 12 files                 │
│  External: 5 packages               │
├─────────────────────────────────────┤
│  ➡️ EXECUTION FLOW                  │
│  [Import Resolution]                  │
│    ↓                                │
│  [Top-level Constants]                │
│    ↓                                │
│  [Component Definition]             │
│    ↓                                │
│  [Export]                           │
└─────────────────────────────────────┘
```

**Display**: Rendered inside the Dashboard webview panel with collapsible sections, syntax-highlighted code snippets, and clickable navigation.

---

### Feature 2: Function Breakdown

**Trigger**: Click on any function name in the File Analysis view or hover in the editor

**Analysis Pipeline**:
1. Locate the function node in the AST
2. Extract: name, parameters (with types), return type annotation, generic type parameters
3. Calculate lines of code (body only, excluding comments and blank lines)
4. Calculate cyclomatic complexity (count of `if`, `switch`, `for`, `while`, `catch`, `&&`, `||`, ternary operators)
5. Calculate nested loop depth (maximum nesting level of `for`/`while`/`forEach` loops)
6. Extract all function calls within the body (both internal and external)
7. Estimate time complexity using heuristics:
   - Single loop → O(n)
   - Nested loops → O(n^m) where m = nesting depth
   - Binary search patterns → O(log n)
   - Recursive calls → flag for manual review
8. Estimate space complexity from array/object allocations and recursion depth
9. Calculate "Code Smell Score" based on:
   - Excessive complexity (>10 cyclomatic)
   - Deep nesting (>3 levels)
   - Excessive parameters (>5)
   - Long function (>50 lines)
   - High coupling (many external calls)

**Output Example**:

```
┌─────────────────────────────────────────┐
│  🔧 findUser()                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  📋 PARAMETERS                          │
│  • id: string                           │
│  • options: FetchOptions (optional)     │
│                                         │
│  ↩️ RETURN TYPE                         │
│  Promise<User | null>                   │
│                                         │
│  📏 LINES OF CODE                       │
│  24 lines (body only)                   │
│                                         │
│  🧠 CYCLOMATIC COMPLEXITY               │
│  4  [████░░░░░░] Low Risk               │
│                                         │
│  🔄 NESTED LOOPS                        │
│  Depth: 1                               │
│                                         │
│  📞 FUNCTION CALLS (6)                   │
│  • fetchUser()     [internal]           │
│  • validateUser()  [internal]           │
│  • logger.info()   [external: utils]    │
│  • cache.get()     [external: services] │
│  • cache.set()     [external: services] │
│  • metrics.track() [external: utils]    │
│                                         │
│  ⏱️ ESTIMATED COMPLEXITY                │
│  Time:  O(n)                            │
│  Space: O(1)                            │
│                                         │
│  ⚠️ CODE SMELL SCORE: 12/100            │
│  ✅ Clean function                      │
└─────────────────────────────────────────┘
```

---

### Feature 3: Execution Flow Viewer

**Purpose**: Visualize how code executes within a function, method, or file

**Analysis Pipeline**:
1. Parse the target scope's AST
2. Extract control flow structures:
   - Sequential statements
   - Conditional branches (`if/else`, `switch`)
   - Loops (`for`, `while`, `do-while`, `for-of`, `for-in`)
   - Exception handling (`try/catch/finally`)
   - Function calls (as nodes or sub-flows)
   - Returns and throws (as terminal nodes)
3. Build a control flow graph (CFG) with nodes and edges
4. Simplify the CFG for visualization (merge sequential nodes, highlight decision points)

**Visualization Requirements**:
- Use **React Flow** for the diagram canvas
- Node types:
  - **Start Node**: Green circle, entry point
  - **Process Node**: Rectangle, normal statements
  - **Decision Node**: Diamond, conditionals
  - **Loop Node**: Rounded rectangle with loop icon
  - **Call Node**: Rectangle with phone icon, function calls
  - **Terminal Node**: Red circle, return/throw/exit
- Edge types:
  - **Default**: Straight or bezier lines
  - **True Branch**: Green label
  - **False Branch**: Red label
  - **Loop Back**: Curved line with arrow
- Interactivity:
  - Click any node to jump to source code location
  - Zoom and pan with mouse/touchpad
  - Mini-map in corner for navigation
  - Fit-to-view button
  - Export as PNG/SVG

**Example Flowchart**:

```
                    ┌─────────────┐
                    │   [START]   │
                    │  User Login │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   [INPUT]   │
                    │ Click Button│
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  [DECISION] │
                    │ Valid Input?│
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │ YES                     │ NO
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │   [PROCESS] │          │   [PROCESS] │
       │  API Call   │          │ Show Error  │
       └──────┬──────┘          └──────┬──────┘
              │                         │
              ▼                         │
       ┌─────────────┐                  │
       │  [DECISION] │                  │
       │  Success?   │                  │
       └──────┬──────┘                  │
              │                         │
    ┌─────────┴──────────┐              │
    │ YES                │ NO           │
    ▼                    ▼              │
┌──────────┐      ┌─────────────┐      │
│ [PROCESS]│      │   [PROCESS] │      │
│Update    │      │ Retry Logic │      │
│State     │      └──────┬──────┘      │
└────┬─────┘             │             │
     │                   │             │
     │                   └──────┬──────┘
     │                          │
     └────────────┬─────────────┘
                  │
                  ▼
           ┌─────────────┐
           │   [END]     │
           │   Return    │
           └─────────────┘
```

---

### Feature 4: Complexity Analysis

**Purpose**: Identify risky, hard-to-maintain, and potentially buggy code

**Metrics Calculated for Every Function**:

| Metric | Definition | Thresholds |
|--------|-----------|------------|
| **Cyclomatic Complexity** | Number of independent paths through the code | Low: 1-5, Medium: 6-10, High: 11-20, Critical: 21+ |
| **Cognitive Complexity** | Human-understandability score (nesting penalties) | Low: 1-5, Medium: 6-10, High: 11-20, Critical: 21+ |
| **Nested Loop Depth** | Maximum level of loop nesting | Warning: 2, Critical: 3+ |
| **Estimated Time Complexity** | Big-O heuristic from loop patterns | O(1), O(log n), O(n), O(n log n), O(n²), O(n³), O(2ⁿ), O(n!) |
| **Estimated Space Complexity** | Big-O heuristic from allocations | O(1), O(log n), O(n), O(n²), etc. |
| **Code Smell Score** | Composite score (0-100) based on multiple factors | Good: 0-20, Warning: 21-50, Bad: 51-80, Critical: 81-100 |

**Complexity Calculation Details**:

```typescript
// Cyclomatic Complexity (McCabe)
function calculateCyclomaticComplexity(node: FunctionNode): number {
  let complexity = 1; // Base path

  traverse(node, (child) => {
    switch (child.type) {
      case 'IfStatement':
      case 'ConditionalExpression':
        complexity += 1;
        break;
      case 'SwitchCase':
        complexity += 1;
        break;
      case 'ForStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForOfStatement':
      case 'ForInStatement':
        complexity += 1;
        break;
      case 'CatchClause':
        complexity += 1;
        break;
      case 'LogicalExpression':
        if (child.operator === '&&' || child.operator === '||') {
          complexity += 1;
        }
        break;
    }
  });

  return complexity;
}

// Nested Loop Depth
function calculateNestedLoopDepth(node: FunctionNode): number {
  let maxDepth = 0;
  let currentDepth = 0;

  traverse(node, (child) => {
    if (isLoopNode(child)) {
      currentDepth += 1;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
  }, (child) => {
    if (isLoopNode(child)) {
      currentDepth -= 1;
    }
  });

  return maxDepth;
}

// Time Complexity Estimation
function estimateTimeComplexity(node: FunctionNode): ComplexityClass {
  const loopDepth = calculateNestedLoopDepth(node);
  const hasRecursion = detectRecursion(node);
  const hasBinarySearch = detectBinarySearchPattern(node);

  if (hasRecursion) return ComplexityClass.UNKNOWN; // Flag for manual review
  if (hasBinarySearch) return ComplexityClass.LOGARITHMIC;
  if (loopDepth === 0) return ComplexityClass.CONSTANT;
  if (loopDepth === 1) return ComplexityClass.LINEAR;
  if (loopDepth === 2) return ComplexityClass.QUADRATIC;
  if (loopDepth >= 3) return ComplexityClass.CUBIC;

  return ComplexityClass.UNKNOWN;
}
```

**Risky Code Highlighting**:
- Functions with complexity > 10 are highlighted in orange
- Functions with complexity > 20 are highlighted in red
- Nested loops > 2 levels deep trigger a warning badge
- Code smell score > 50 shows a warning icon

**Example Report**:

```
⚠️ COMPLEXITY ALERT

Function: processDataMatrix()
File: src/utils/dataProcessor.ts:142

Complexity: HIGH (17)

Reasons:
  ❌ 4 nested loops (lines 145-167)
  ❌ 7 conditional branches
  ❌ 12 function calls (high coupling)
  ❌ 89 lines of code (too long)
  ❌ 6 parameters (excessive)

Suggested Actions:
  → Extract inner loops into separate functions
  → Replace nested loops with flatMap/reduce where possible
  → Split into smaller, focused functions
  → Consider using a matrix library for operations
```

---

### Feature 5: Dependency Graph

**Purpose**: Visualize module relationships and navigate the codebase

**Analysis Pipeline**:
1. Scan all source files in the project (respecting `.gitignore` and `tsconfig.json` `include`/`exclude`)
2. For each file, extract:
   - Import statements (`import`, `require`, `dynamic import`)
   - Export statements (`export`, `module.exports`)
   - Re-exports (`export * from`, `export { x } from`)
3. Resolve import paths to actual files (handle aliases from `tsconfig.json` `paths`, webpack aliases, etc.)
4. Build a directed graph where:
   - Nodes = files/modules
   - Edges = import relationships (A → B means A imports from B)
5. Calculate node metrics:
   - In-degree (how many files import this)
   - Out-degree (how many files this imports)
   - Centrality (how critical this file is to the project)

**Graph Visualization Requirements**:
- Use **D3.js** force-directed graph or **React Flow** with custom layout
- Node sizing: proportional to file size or centrality
- Node coloring: by file type (JS=blue, TS=cyan, React=purple, CSS=yellow, etc.)
- Edge styling: curved lines, arrowheads showing direction
- Interactivity:
  - Click node → open file in editor
  - Hover node → show file info tooltip (name, size, complexity)
  - Double-click node → expand/collapse subtree
  - Drag to pan, scroll to zoom
  - Filter by file type or dependency depth
  - Search for specific files
  - Highlight path between two selected nodes

**Example Graph**:

```
                    ┌─────────────┐
                    │  Dashboard  │
                    │   .tsx      │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │UserService│ │ChartComp │ │Sidebar   │
       │   .ts     │ │  .tsx    │ │  .tsx    │
       └─────┬─────┘ └──────────┘ └──────────┘
             │
             ▼
       ┌──────────┐
       │ ApiClient│
       │   .ts    │
       └─────┬─────┘
             │
             ▼
       ┌──────────┐
       │ Database │
       │  .ts     │
       └──────────┘
```

**Navigation Features**:
- Click any node to see its imports and exports list
- "Show Dependents" button: highlight all files that import the selected file
- "Show Dependencies" button: highlight all files the selected file imports
- "Find Circular Dependencies" button: detect and highlight import cycles

---

### Feature 6: Project Overview

**Command**: `CodeScope: Analyze Repository`

**Trigger**: Command Palette, welcome page button, or status bar click

**Analysis Pipeline**:
1. Detect project type by examining:
   - `package.json` dependencies (React, Vue, Angular, Express, Next.js, etc.)
   - Framework-specific config files (`vite.config.ts`, `next.config.js`, `angular.json`)
   - File extensions distribution (`.tsx` vs `.vue` vs `.svelte`)
2. Identify entry points:
   - `package.json` `main`, `module`, `exports` fields
   - Framework entry points (`src/main.tsx`, `src/index.ts`, `pages/_app.tsx`)
   - Test entry points (`jest.config.js`, `vitest.config.ts`)
3. Build folder structure tree with metadata (file count, total lines per folder)
4. Build full dependency tree
5. Calculate project-wide metrics:
   - Total files, total lines of code
   - Language distribution (pie chart)
   - Average complexity per file
   - Most complex files (top 10)
   - Most imported files (top 10)
   - Unused exports detection
6. Generate suggested reading order using topological sort of dependency graph:
   - Start with files that have zero dependencies (foundations)
   - Progress to files that depend on already-read files
   - Entry points come last (they tie everything together)

**Output Example**:

```
┌─────────────────────────────────────────────────────┐
│  📊 PROJECT OVERVIEW                                │
│  my-awesome-app                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🏷️ PROJECT TYPE                                   │
│  React + TypeScript + Vite Application             │
│                                                     │
│  📁 FOLDER STRUCTURE                                │
│  src/                                               │
│  ├── components/        (24 files, 3,200 LOC)      │
│  ├── hooks/             (8 files, 420 LOC)           │
│  ├── services/          (6 files, 890 LOC)           │
│  ├── utils/             (12 files, 1,100 LOC)       │
│  ├── types/             (4 files, 180 LOC)           │
│  ├── pages/             (6 files, 1,500 LOC)          │
│  ├── App.tsx            (45 LOC)                     │
│  └── main.tsx           (28 LOC)                     │
│                                                     │
│  📈 METRICS                                         │
│  • Total Files:        64                           │
│  • Total LOC:          7,363                        │
│  • Functions:          312                          │
│  • Classes:            18                           │
│  • Average Complexity: 4.2                          │
│  • High Risk Files:    3                            │
│                                                     │
│  🎯 ENTRY POINTS                                    │
│  1. src/main.tsx                                    │
│  2. src/App.tsx                                     │
│                                                     │
│  📚 SUGGESTED READING ORDER                         │
│  1. src/types/index.ts        [Foundation]          │
│  2. src/utils/constants.ts    [Foundation]          │
│  3. src/services/api.ts       [Core Service]        │
│  4. src/hooks/useAuth.ts      [Business Logic]      │
│  5. src/components/Header.tsx  [UI Component]        │
│  6. src/pages/Dashboard.tsx   [Page]                │
│  7. src/App.tsx               [Entry Point]         │
│                                                     │
│  ⚠️ POTENTIAL ISSUES                                │
│  • 3 files have cyclomatic complexity > 15            │
│  • 2 circular dependencies detected                 │
│  • 12 unused exports found                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Feature 7: Architecture Explorer

**Purpose**: Automatically detect and visualize the architectural layers of a project

**Detection Heuristics**:

| Layer | Detection Rules |
|-------|----------------|
| **Frontend/UI Layer** | Files in `components/`, `pages/`, `views/`, `ui/` folders; heavy React/Vue/Angular imports; JSX/TSX files |
| **Backend/API Layer** | Files in `api/`, `routes/`, `controllers/`, `handlers/` folders; Express/Fastify/NestJS imports |
| **Service/Business Logic Layer** | Files in `services/`, `useCases/`, `domain/` folders; pure functions with business logic |
| **Data/Database Layer** | Files in `models/`, `entities/`, `repositories/`, `db/` folders; ORM imports (Prisma, TypeORM, Sequelize) |
| **Utilities Layer** | Files in `utils/`, `helpers/`, `lib/` folders; helper functions, formatters, validators |
| **Configuration Layer** | Files in `config/`, `constants/` folders; env variable usage, config objects |
| **Test Layer** | Files matching `*.test.*`, `*.spec.*`; testing framework imports |

**Architecture Diagram**:
- Visualize as a layered diagram (Frontend → API → Service → Database)
- Show file counts and key files per layer
- Show inter-layer dependencies (which layers call which)
- Detect anti-patterns (e.g., UI layer directly calling Database layer)

**Example Architecture View**:

```
┌─────────────────────────────────────────────┐
│         🎨 FRONTEND LAYER                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │Dashboard│ │ Sidebar │ │  Modal  │       │
│  │  .tsx   │ │  .tsx   │ │  .tsx   │       │
│  └────┬────┘ └────┬────┘ └────┬────┘       │
│       │           │           │              │
│       └───────────┼───────────┘              │
│                   │                          │
├───────────────────┼──────────────────────────┤
│         🔌 API LAYER                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ /users  │ │ /orders │ │ /auth   │       │
│  │routes.ts│ │routes.ts│ │routes.ts│       │
│  └────┬────┘ └────┬────┘ └────┬────┘       │
│       │           │           │              │
│       └───────────┼───────────┘              │
│                   │                          │
├───────────────────┼──────────────────────────┤
│      ⚙️ SERVICE LAYER                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │UserSvc  │ │OrderSvc │ │AuthSvc  │       │
│  │  .ts    │ │  .ts    │ │  .ts    │       │
│  └────┬────┘ └────┬────┘ └────┬────┘       │
│       │           │           │              │
│       └───────────┼───────────┘              │
│                   │                          │
├───────────────────┼──────────────────────────┤
│      💾 DATA LAYER                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │UserModel│ │OrderRepo│ │AuthRepo │       │
│  │  .ts    │ │  .ts    │ │  .ts    │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│                                              │
│  ⚠️ Anti-pattern detected:                   │
│  Dashboard.tsx directly imports UserModel.ts │
│  (bypasses Service layer)                    │
└─────────────────────────────────────────────┘
```

---

### Feature 8: Code Heatmap

**Purpose**: Identify hotspots in the codebase that need attention

**Heatmap Dimensions** (user can switch between views):

| View | Metric | Color Scale |
|------|--------|-------------|
| **Complexity Heatmap** | Cyclomatic complexity per file | Green → Yellow → Orange → Red |
| **Import Heatmap** | Number of imports per file | Blue → Purple → Pink |
| **Dependency Heatmap** | Number of dependents (in-degree) | Light → Dark |
| **Size Heatmap** | Lines of code per file | Small → Large |
| **Churn Heatmap** | Git change frequency (if git available) | Stable → Volatile |
| **Bottleneck Heatmap** | Composite score (complexity × dependents ÷ size) | Custom gradient |

**Visualization**:
- Treemap view: folders as rectangles, files as sub-rectangles, color = metric, size = file size
- List view: sortable table with color-coded bars
- File explorer overlay: color-code the native VS Code file explorer (if API allows)

**Example Heatmap Report**:

```
🔥 TOP 10 COMPLEXITY HOTSPOTS

Rank │ File                          │ Complexity │ Risk
─────┼───────────────────────────────┼────────────┼────────
  1  │ src/utils/dataProcessor.ts    │     34     │ 🔴 CRITICAL
  2  │ src/services/auth.ts          │     28     │ 🔴 CRITICAL
  3  │ src/components/DataGrid.tsx   │     22     │ 🟠 HIGH
  4  │ src/api/routes.ts             │     19     │ 🟠 HIGH
  5  │ src/hooks/useForm.ts          │     16     │ 🟡 MEDIUM
  6  │ src/utils/validators.ts       │     14     │ 🟡 MEDIUM
  7  │ src/services/payment.ts       │     13     │ 🟡 MEDIUM
  8  │ src/components/Chart.tsx      │     12     │ 🟡 MEDIUM
  9  │ src/api/middleware.ts         │     11     │ 🟡 MEDIUM
 10  │ src/utils/helpers.ts          │     10     │ 🟢 LOW
```

---

### Feature 9: Variable Tracker

**Purpose**: Trace the lifecycle of any variable through the codebase

**Trigger**: Right-click on a variable in the editor → "CodeScope: Track Variable"

**Analysis Pipeline**:
1. Resolve the variable's declaration site using TypeScript's Language Service API
2. Find all references using `findReferences()`
3. Categorize each reference:
   - **Declaration**: `const x = ...`, `let x = ...`, `var x = ...`, parameter declaration
   - **Assignment**: `x = ...`, `x += ...`, `x++`, destructuring assignment
   - **Read**: `console.log(x)`, `foo(x)`, `if (x)`, `return x`
   - **Modification**: `x.push()`, `x.prop = ...` (for objects/arrays)
4. Build a timeline of the variable's lifecycle
5. Show which functions use the variable (data flow analysis)

**Output Example**:

```
🔍 VARIABLE TRACKER: userSession

📍 DECLARED HERE
  File: src/services/auth.ts:15
  Line: const userSession: Session = { ... }
  Scope: Function authenticate()

✏️ MODIFIED HERE (3 locations)
  1. src/services/auth.ts:22
     userSession.token = response.token;
  2. src/services/auth.ts:35
     userSession.lastActive = Date.now();
  3. src/services/auth.ts:48
     userSession = null; // on logout

👁️ READ HERE (7 locations)
  1. src/services/auth.ts:25
     if (userSession.isValid) { ... }
  2. src/components/Header.tsx:12
     const name = userSession.user.name;
  3. src/hooks/useAuth.ts:8
     return userSession;
  4. src/api/middleware.ts:19
     req.session = userSession;
  5. src/utils/permissions.ts:5
     return checkRole(userSession.role);
  6. src/pages/Profile.tsx:33
     setData(userSession.profile);
  7. src/services/auth.ts:42
     return userSession.id;

🔗 USED IN FUNCTIONS
  • authenticate()     [declared, modified]
  • getUserName()      [read]
  • useAuth()          [read]
  • authMiddleware()   [read]
  • checkPermissions() [read]
  • loadProfile()      [read]
  • getSessionId()     [read]

⚠️  POTENTIAL ISSUES
  • Reassigned after declaration (let vs const)
  • Read in 7 different functions (high coupling)
  • Modified in 3 locations (mutation tracking difficult)
```

---

### Feature 10: Call Hierarchy

**Purpose**: Visualize the call tree for any function

**Trigger**: Right-click on a function → "CodeScope: Show Call Hierarchy"

**Analysis Pipeline**:
1. Build a call graph for the entire project:
   - For each function, find all function calls within its body
   - For each function call, resolve the target function (handle imports, method calls, etc.)
2. Support two views:
   - **Callers View**: Who calls this function? (bottom-up)
   - **Callees View**: What does this function call? (top-down)
3. Handle edge cases:
   - Indirect calls (callbacks, event handlers)
   - Polymorphic calls (interface methods, abstract classes)
   - Dynamic imports
   - Recursive calls (detect and mark cycles)

**Visualization**:
- Tree view with expandable/collapsible nodes
- Each node shows: function name, file, line number, call count
- Recursive calls highlighted with a cycle icon
- External/library calls marked with a package icon
- Click any node to navigate to definition

**Example Call Hierarchy**:

```
📞 CALL HIERARCHY: login()

▼ login()                              [src/pages/Login.tsx:23]
  │
  ├── ▶ validate()                     [src/utils/validators.ts:45]
  │     │
  │     ├── ▶ isEmail()                [src/utils/validators.ts:12]
  │     └── ▶ isPasswordStrong()       [src/utils/validators.ts:28]
  │
  ├── ▶ fetchUser()                    [src/services/auth.ts:67]
  │     │
  │     ├── ▶ apiClient.get()          [src/services/api.ts:15]  📦 external
  │     ├── ▶ cache.get()              [src/services/cache.ts:8]
  │     └── ▶ logger.info()            [src/utils/logger.ts:33]
  │
  ├── ▶ saveSession()                  [src/services/auth.ts:89]
  │     │
  │     ├── ▶ storage.setItem()        [src/utils/storage.ts:5]
  │     └── ▶ metrics.track()          [src/utils/metrics.ts:19]
  │
  └── ▶ redirectToDashboard()          [src/utils/navigation.ts:7]
        │
        └── ▶ router.push()            [next/router]  📦 external

🔁 RECURSIVE CALLS DETECTED: 0
📦 EXTERNAL CALLS: 2
📊 TOTAL CALL CHAIN DEPTH: 4 levels
```

---

## 8. User Interface Requirements

### 8.1 Design Inspiration

The UI must feel like a premium developer tool, drawing inspiration from:

- **Linear** — Clean, minimal, focused, beautiful typography
- **Raycast** — Command palette feel, keyboard-first, fast
- **VS Code Native** — Seamless integration with existing theme and layout
- **GitHub Insights** — Data-rich but not overwhelming

### 8.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 Header                                                    [🔄 Refresh] │
│  CodeScope — my-awesome-app                                   [⚙️ Settings]│
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐  ┌───────────────────────────────────────┐│
│  │ 📊 Repository Summary       │  │ 🕸️ Dependency Graph                  ││
│  │ • Files: 64                 │  │  [Interactive D3.js graph]            ││
│  │ • LOC: 7,363                │  │                                       ││
│  │ • Functions: 312            │  │                                       ││
│  │ • Complexity: 4.2 avg       │  │                                       ││
│  │ • Risk Files: 3             │  │                                       ││
│  └─────────────────────────────┘  └───────────────────────────────────────┘│
│  ┌─────────────────────────────┐  ┌───────────────────────────────────────┐│
│  │ ⚡ Complexity Cards         │  │ 🏛️ Architecture View                  ││
│  │ [Top 5 complex functions]    │  │  [Layered diagram]                    ││
│  │                             │  │                                       ││
│  │ • processData: 34 🔴        │  │                                       ││
│  │ • authenticate: 28 🔴       │  │                                       ││
│  │ • renderGrid: 22 🟠         │  │                                       ││
│  │ • handleRoute: 19 🟠        │  │                                       ││
│  │ • useForm: 16 🟡            │  │                                       ││
│  └─────────────────────────────┘  └───────────────────────────────────────┘│
│  ┌─────────────────────────────┐  ┌───────────────────────────────────────┐│
│  │ 🔍 Function Explorer        │  │ 📞 Call Hierarchy                     ││
│  │ [Sortable function list]    │  │  [Tree visualization]                 ││
│  │                             │  │                                       ││
│  │ Name        │ LOC │ Comp │  │                                       ││
│  │─────────────┼─────┼──────│  │                                       ││
│  │ findUser    │ 24  │ 4    │  │                                       ││
│  │ validate    │ 18  │ 6    │  │                                       ││
│  │ processData │ 89  │ 34   │  │                                       ││
│  └─────────────────────────────┘  └───────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Theme Integration

The UI must use VS Code's native CSS variables for theming. No hardcoded colors.

```css
/* Required CSS Variables */
:root {
  /* Backgrounds */
  --cs-bg-primary: var(--vscode-editor-background);
  --cs-bg-secondary: var(--vscode-sideBar-background);
  --cs-bg-tertiary: var(--vscode-panel-background);
  --cs-bg-hover: var(--vscode-list-hoverBackground);
  --cs-bg-selected: var(--vscode-list-activeSelectionBackground);

  /* Foregrounds */
  --cs-fg-primary: var(--vscode-editor-foreground);
  --cs-fg-secondary: var(--vscode-descriptionForeground);
  --cs-fg-muted: var(--vscode-disabledForeground);

  /* Accents */
  --cs-accent: var(--vscode-button-background);
  --cs-accent-hover: var(--vscode-button-hoverBackground);
  --cs-accent-fg: var(--vscode-button-foreground);

  /* Borders */
  --cs-border: var(--vscode-panel-border);
  --cs-border-light: var(--vscode-widget-border);

  /* Status Colors */
  --cs-success: var(--vscode-testing-iconPassed);
  --cs-warning: var(--vscode-editorWarning-foreground);
  --cs-error: var(--vscode-editorError-foreground);
  --cs-info: var(--vscode-editorInfo-foreground);

  /* Syntax (for code snippets in UI) */
  --cs-keyword: var(--vscode-symbolIcon-keywordForeground);
  --cs-string: var(--vscode-symbolIcon-stringForeground);
  --cs-function: var(--vscode-symbolIcon-functionForeground);
  --cs-variable: var(--vscode-symbolIcon-variableForeground);
  --cs-type: var(--vscode-symbolIcon-typeParameterForeground);
}
```

### 8.4 Responsive Behavior

- Dashboard panels should reflow on resize
- Sidebar should collapse on narrow views
- Graphs should support zoom and pan on all screen sizes
- Mobile support is not required (VS Code is desktop-first)

---

## 9. Performance Requirements

### 9.1 Scale Targets

| Metric | Target |
|--------|--------|
| Files | 1,000+ source files |
| Lines of Code | 100,000+ lines |
| Initial Analysis Time | < 5 seconds for 1,000 files |
| Incremental Update | < 500ms for single file change |
| Memory Usage | < 500MB for large projects |
| UI Responsiveness | 60fps for all interactions |

### 9.2 Performance Strategies

1. **Caching Layer**:
   - Cache AST parsing results per file (invalidated on file change)
   - Cache dependency graph (incrementally updated on imports change)
   - Cache complexity calculations (function-level granularity)
   - Cache symbol index (updated on declaration changes)
   - Use an LRU cache with configurable size limits

2. **Incremental Analysis**:
   - Only re-analyze changed files on save
   - Update dependent files' analysis (e.g., if a function signature changes, re-analyze callers)
   - Debounce rapid changes (e.g., typing) with 500ms delay

3. **Lazy Loading**:
   - Only parse files when first accessed
   - Load dependency graph nodes on-demand as user expands
   - Virtualize long lists (function explorer, file tree)

4. **Web Workers**:
   - Offload AST parsing to background workers
   - Offload graph layout calculations (D3.js force simulation)
   - Offload complexity analysis for large files
   - Use `vscode.Webview` message passing for worker communication

5. **Index Service**:
   - Build a project-wide symbol index on first analysis
   - Index maps: symbol name → file → line → type
   - Enables O(1) symbol lookups instead of O(n) file scans
   - Update index incrementally on file changes

### 9.3 Memory Management

- Dispose of AST nodes after analysis (don't hold full AST in memory)
- Use WeakMaps for caches that should auto-collect
- Limit graph node rendering to viewport + buffer
- Implement pagination for large result sets

---

## 10. Future Expansion Architecture

The codebase must be architected to support additional language analyzers without rewriting the core.

### 10.1 Plugin Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE ENGINE                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Parser     │  │  Analyzer   │  │  Visualization      │ │
│  │  Interface  │  │  Interface  │  │  Interface          │ │
│  │  (generic)  │  │  (generic)  │  │  (generic)          │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │              │
│         ▼                ▼                     ▼              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              LANGUAGE PLUGIN INTERFACE                   ││
│  │  • parse(source: string): AST                           ││
│  │  • extractFunctions(ast): FunctionNode[]                ││
│  │  • extractImports(ast): ImportNode[]                      ││
│  │  • extractClasses(ast): ClassNode[]                     ││
│  │  • calculateComplexity(node): number                    ││
│  │  • resolveSymbol(name): SymbolLocation                  ││
│  └─────────────────────────────────────────────────────────┘│
│         │                │                     │              │
│         ▼                ▼                     ▼              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │ TypeScript│    │  Rust    │    │  Python  │             │
│  │ Analyzer  │    │ Analyzer │    │ Analyzer │             │
│  │ (built-in)│    │ (plugin) │    │ (plugin) │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│                                                             │
│  Future: Java, C++, Go, Ruby, PHP, Swift, Kotlin...        │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Plugin Requirements

Each language plugin must implement:

```typescript
interface LanguageAnalyzer {
  readonly languageId: string;           // 'typescript', 'rust', 'python'
  readonly fileExtensions: string[];     // ['.ts', '.tsx']

  // Parsing
  parse(sourceCode: string, filePath: string): AST;

  // Extraction
  extractFunctions(ast: AST): FunctionNode[];
  extractClasses(ast: AST): ClassNode[];
  extractVariables(ast: AST): VariableNode[];
  extractImports(ast: AST): ImportNode[];
  extractExports(ast: AST): ExportNode[];

  // Analysis
  calculateCyclomaticComplexity(node: FunctionNode): number;
  calculateCognitiveComplexity(node: FunctionNode): number;
  estimateTimeComplexity(node: FunctionNode): ComplexityClass;
  estimateSpaceComplexity(node: FunctionNode): ComplexityClass;

  // Navigation
  findReferences(ast: AST, symbolName: string): Reference[];
  resolveImport(importPath: string, currentFile: string): string | null;

  // Metadata
  detectProjectType(files: string[]): ProjectType;
  findEntryPoints(files: string[]): string[];
}
```

### 10.3 Planned Language Support

| Priority | Language | Parser Library |
|----------|----------|----------------|
| P0 | TypeScript / JavaScript | TypeScript Compiler API, Babel |
| P1 | Rust | rust-analyzer parser, tree-sitter-rust |
| P1 | Python | tree-sitter-python, ast module |
| P2 | Java | JavaParser, tree-sitter-java |
| P2 | C++ | tree-sitter-cpp, clang AST |
| P3 | Go | tree-sitter-go, go/ast |
| P3 | Ruby | tree-sitter-ruby |
| P4 | PHP | tree-sitter-php |
| P4 | Swift | tree-sitter-swift |
| P4 | Kotlin | tree-sitter-kotlin |

---

## 11. Deliverables

Generate the complete VS Code extension scaffold with all of the following:

### 11.1 Extension Core

- [ ] `extension.ts` — Extension activation, deactivation, event handlers
- [ ] `package.json` — Extension manifest with:
  - Commands registration (all 10 features)
  - Views contribution (sidebar panels)
  - Configuration schema
  - Activation events
  - Dependencies

### 11.2 Command System

- [ ] `analyzeFile.ts` — "CodeScope: Analyze Current File"
- [ ] `analyzeProject.ts` — "CodeScope: Analyze Repository"
- [ ] `dependencyGraph.ts` — "CodeScope: Show Dependency Graph"
- [ ] `complexityAnalysis.ts` — "CodeScope: Show Complexity Report"
- [ ] `showDashboard.ts` — "CodeScope: Open Dashboard"
- [ ] `trackVariable.ts` — "CodeScope: Track Variable" (context menu)
- [ ] `showCallHierarchy.ts` — "CodeScope: Show Call Hierarchy" (context menu)
- [ ] `showExecutionFlow.ts` — "CodeScope: Show Execution Flow" (context menu)

### 11.3 Analysis Engines

- [ ] `astAnalyzer.ts` — Generic AST traversal and node extraction
- [ ] `functionAnalyzer.ts` — Function signature, body, and call analysis
- [ ] `classAnalyzer.ts` — Class hierarchy, methods, properties analysis
- [ ] `dependencyAnalyzer.ts` — Import resolution and module graph building
- [ ] `complexityAnalyzer.ts` — Cyclomatic, cognitive, and Big-O analysis
- [ ] `flowAnalyzer.ts` — Control flow graph generation
- [ ] `architectureAnalyzer.ts` — Layer detection and anti-pattern identification
- [ ] `variableTracker.ts` — Variable declaration, assignment, and usage tracking
- [ ] `callHierarchyAnalyzer.ts` — Caller/callee graph construction

### 11.4 Services

- [ ] `parserService.ts` — Unified parser facade with caching
- [ ] `graphService.ts` — Graph operations (DFS, BFS, topological sort, cycle detection)
- [ ] `cacheService.ts` — File and analysis result caching with invalidation
- [ ] `indexService.ts` — Project-wide symbol indexing
- [ ] `workerService.ts` — Web Worker pool for background tasks
- [ ] `themeService.ts` — VS Code theme synchronization

### 11.5 Webview UI (React)

- [ ] `DashboardPanel.ts` — Main webview panel controller
- [ ] `main.tsx` — React entry point
- [ ] `App.tsx` — Root component with React Router
- [ ] All view components (DashboardView, FileAnalysisView, etc.)
- [ ] All reusable components (Header, Sidebar, ComplexityCard, etc.)
- [ ] Custom hooks (useVSCodeTheme, useExtensionMessage, useAnalysisData)
- [ ] VS Code CSS variable integration
- [ ] Tailwind configuration

### 11.6 Type Definitions

- [ ] `types.ts` — Core interfaces (FileAnalysis, FunctionAnalysis, etc.)
- [ ] `graph.ts` — Graph node and edge types
- [ ] `analysis.ts` — Analysis result types
- [ ] `complexity.ts` — Complexity enum and utility types
- [ ] `theme.ts` — VS Code theme type definitions

### 11.7 Configuration & Assets

- [ ] `package.json` with full contribution points
- [ ] `tsconfig.json` for extension
- [ ] `tsconfig.json` for webview
- [ ] `vite.config.ts` for webview build
- [ ] `tailwind.config.js` with VS Code theme integration
- [ ] `webpack.config.js` for extension bundling
- [ ] Extension icons and logos
- [ ] README.md with installation and usage instructions

### 11.8 Testing

- [ ] Unit tests for all analyzers
- [ ] Integration tests for command handlers
- [ ] Performance benchmarks for large codebases
- [ ] Mock fixtures for test projects

---

## 12. Quality Standards

### 12.1 Code Quality

- All TypeScript code must have strict mode enabled (`strict: true`)
- No `any` types without explicit justification
- Comprehensive JSDoc comments on all public APIs
- ESLint with recommended + TypeScript rules
- Prettier for consistent formatting

### 12.2 Extension Quality

- Follow VS Code Extension Guidelines
- Proper error handling with user-friendly messages
- Progress indicators for long-running operations
- Cancellation token support for all async operations
- Proper resource disposal (subscriptions, file watchers, webview panels)

### 12.3 UI Quality

- All UI text must support i18n (English default, i18n framework ready)
- Keyboard navigation support (Tab, Enter, Escape, Arrow keys)
- Screen reader compatible (ARIA labels, roles)
- 60fps animations and transitions
- No layout shifts during data loading

---

## 13. Success Criteria

The final product should feel like a professional code intelligence platform comparable to **Sourcegraph** or **CodeSee**, but with the following critical differences:

| Aspect | Sourcegraph/CodeSee | CodeScope |
|--------|---------------------|-----------|
| **AI Dependency** | May use AI for some features | ❌ Zero AI |
| **Network Required** | Yes (cloud-based) | ❌ Fully offline |
| **Privacy** | Code may be processed remotely | ✅ 100% local |
| **Determinism** | AI outputs may vary | ✅ Same input = same output |
| **Explainability** | AI reasoning is opaque | ✅ Every insight is traceable |
| **Cost** | Subscription / enterprise | ✅ Free, open-source |
| **Speed** | Network latency | ✅ Instant, local processing |

### 13.1 User Experience Goals

1. A developer opening an unfamiliar codebase should understand its structure within 30 seconds
2. A developer should be able to trace any function's execution flow in under 10 seconds
3. A developer should be able to identify the most complex/risky code at a glance
4. A developer should be able to navigate from any symbol to its definition and all references instantly
5. The extension should never feel slower than native VS Code features

---

## 14. Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| **Offline Operation** | Must work 100% without internet connectivity |
| **Privacy** | No code, metadata, or telemetry leaves the local machine |
| **Determinism** | Same codebase must always produce identical analysis results |
| **Extensibility** | Plugin architecture for new language support |
| **Performance** | < 5s initial analysis for 1000 files; < 500ms incremental |
| **Compatibility** | VS Code 1.80+; supports all VS Code themes |
| **Memory** | < 500MB RAM for large projects |
| **Platform** | Cross-platform (Windows, macOS, Linux) |

---

## 15. Summary Checklist

- [ ] Zero AI / Zero LLM / Zero API calls
- [ ] Fully offline operation
- [ ] AST-based code understanding
- [ ] Static analysis for all metrics
- [ ] Interactive dependency graphs
- [ ] Execution flow visualization
- [ ] Complexity analysis with risk highlighting
- [ ] Project overview with reading order suggestions
- [ ] Architecture layer detection
- [ ] Code heatmap visualization
- [ ] Variable lifecycle tracking
- [ ] Call hierarchy visualization
- [ ] Premium UI matching VS Code native theme
- [ ] Performance optimized for 1000+ files
- [ ] Plugin architecture for future languages
- [ ] Production-ready code quality

---

> **Final Note**: CodeScope is not an AI replacement — it's an AI alternative. It proves that classical computer science (parsing, graph theory, static analysis) can provide powerful, deterministic, and trustworthy code intelligence without the unpredictability, privacy concerns, or resource requirements of modern AI systems.

# CodeScope

Understand any codebase — no AI required. CodeScope is a powerful, 100% offline static analysis extension for VS Code that uses AST parsing and Directed Graphs to give you deep insights into your architecture and complexity.

## Features

- **Project Overview**: Instant insights into total files, entry points, reading order, and architectural layers.
- **Dependency Graph**: Interactive visualization of internal file dependencies and circular dependency detection.
- **Complexity Report**: Identifies the most complex functions in your project based on Cyclomatic and Cognitive complexity, calculating an aggregate risk score.
- **Execution Flow**: Renders an interactive Control Flow Graph (CFG) for any function, showing you loops, branches, and returns at a glance.
- **Call Hierarchy**: Track where a function is called across your entire codebase and what it calls.

## Zero Dependencies on Cloud

All analysis runs locally on your machine using the TypeScript Compiler API. CodeScope does not send any of your code to external servers or APIs.

## Requirements

- VS Code 1.80.0 or higher.
- A JavaScript or TypeScript project.

## How to Use

1. Open a workspace in VS Code.
2. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
3. Run `CodeScope: Analyze Repository` to launch the dashboard and begin project analysis.
4. You can also right-click on any `.js` or `.ts` file and select `CodeScope: Analyze Current File`.

## Extension Settings

You can configure CodeScope through the standard VS Code settings interface:

*   `codescope.analysis.excludePatterns`: Define glob patterns to ignore during project analysis. (Default: `**/node_modules/**`, `**/dist/**`, etc.)
*   `codescope.complexity.cyclomaticThreshold`: Adjust the threshold for cyclomatic complexity warnings.
*   `codescope.complexity.cognitiveThreshold`: Adjust the threshold for cognitive complexity warnings.

## Privacy

Your code stays on your machine. CodeScope operates entirely offline, making it safe for enterprise and proprietary codebases.

/**
 * Extension entry point — activates features and registers commands.
 */

import * as vscode from 'vscode';
import { COMMANDS } from './config/constants';
import { getParserService } from './services/parserService';
import { getCacheService } from './services/cacheService';
import { getIndexService } from './services/indexService';
import { getThemeService } from './services/themeService';
import { getWorkerService } from './services/workerService';
import { DashboardPanel } from './panels/DashboardPanel';

// Commands
import { analyzeFileCommand } from './commands/analyzeFile';
import { analyzeProjectCommand } from './commands/analyzeProject';
import { dependencyGraphCommand } from './commands/dependencyGraph';
import { complexityAnalysisCommand } from './commands/complexityAnalysis';
import { trackVariableCommand } from './commands/trackVariable';
import { showCallHierarchyCommand } from './commands/showCallHierarchy';
import { showExecutionFlowCommand } from './commands/showExecutionFlow';

export function activate(context: vscode.ExtensionContext) {
  console.log('[CodeScope] Extension activated.');

  // Initialize singleton services so they attach their workspace listeners
  getParserService();
  getCacheService();
  getIndexService();
  getThemeService();
  getWorkerService();

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.showDashboard, () => {
      DashboardPanel.createOrShow(context.extensionUri);
    }),
    vscode.commands.registerCommand(COMMANDS.analyzeFile, async (uri?: vscode.Uri) => {
      await analyzeFileCommand(context, uri);
    }),
    vscode.commands.registerCommand(COMMANDS.analyzeProject, async () => {
      await analyzeProjectCommand(context);
    }),
    vscode.commands.registerCommand(COMMANDS.dependencyGraph, async () => {
      await dependencyGraphCommand(context);
    }),
    vscode.commands.registerCommand(COMMANDS.complexityAnalysis, async () => {
      await complexityAnalysisCommand(context);
    }),
    vscode.commands.registerCommand(COMMANDS.trackVariable, async () => {
      await trackVariableCommand(context);
    }),
    vscode.commands.registerCommand(COMMANDS.showCallHierarchy, async () => {
      await showCallHierarchyCommand(context);
    }),
    vscode.commands.registerCommand(COMMANDS.showExecutionFlow, async () => {
      await showExecutionFlowCommand(context);
    })
  );

  // Expose an API for testing if needed
  return {
    getParserService,
    getCacheService,
    getIndexService
  };
}

export function deactivate() {
  console.log('[CodeScope] Extension deactivating.');
  // Services dispose their own resources via singleton destructors or we call them explicitly
  // to clean up file watchers, memory caches, and workers.
  getCacheService().dispose();
  getIndexService().dispose();
  getThemeService().dispose();
  getParserService().clearAll();
}

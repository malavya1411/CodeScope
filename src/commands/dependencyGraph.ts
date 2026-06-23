/**
 * Command: Show Dependency Graph
 */

import * as vscode from 'vscode';
import { DashboardPanel } from '../panels/DashboardPanel';
import { buildDependencyReport } from '../analyzers/dependencyAnalyzer';
import { getCacheService } from '../services/cacheService';

export async function dependencyGraphCommand(context: vscode.ExtensionContext) {
  const rootUri = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (!rootUri) {
    vscode.window.showErrorMessage('CodeScope: Please open a workspace folder first.');
    return;
  }

  const rootPath = rootUri.fsPath;

  try {
    DashboardPanel.createOrShow(context.extensionUri);
    
    const cache = getCacheService();
    if (cache.getDependencyReport(rootPath)) {
        const cached = cache.getDependencyReport(rootPath)!;
        DashboardPanel.postMessage({ type: 'dependencyGraphResult', payload: { success: true, data: cached, duration: 0, timestamp: Date.now() } });
        return;
    }

    DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: 'Building dependency graph...', current: 0, total: 100, percentage: 20 } });

    const start = Date.now();
    const report = await buildDependencyReport(rootPath, (current, total) => {
         DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: `Resolving imports (${current}/${total})...`, current, total, percentage: 20 + Math.floor((current/total) * 70) } });
    });

    cache.setDependencyReport(rootPath, report);

    DashboardPanel.postMessage({ type: 'dependencyGraphResult', payload: { success: true, data: report, duration: Date.now() - start, timestamp: report.generatedAt } });

  } catch (error: any) {
    vscode.window.showErrorMessage(`CodeScope: Failed to build dependency graph. ${error.message}`);
    DashboardPanel.postMessage({ type: 'dependencyGraphResult', payload: { success: false, error: error.message, duration: 0, timestamp: Date.now() } });
  }
}

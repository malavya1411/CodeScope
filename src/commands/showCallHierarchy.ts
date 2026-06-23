/**
 * Command: Show Call Hierarchy
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { DashboardPanel } from '../panels/DashboardPanel';
import { buildCallGraph, getHierarchy } from '../analyzers/callHierarchyAnalyzer';
import { getParserService, getNodeText } from '../services/parserService';
import { findFunctionNodeByName } from '../analyzers/flowAnalyzer'; // Reuse this helper

export async function showCallHierarchyCommand(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('CodeScope: Please open a file and place your cursor on a function.');
    return;
  }

  const document = editor.document;
  const position = editor.selection.active;
  const filePath = document.uri.fsPath;
  const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!rootPath) {
     vscode.window.showErrorMessage('CodeScope: Please open a workspace folder first.');
     return;
  }

  try {
    const parser = getParserService();
    const parsed = parser.parseFile(filePath);
    if (!parsed) {
        throw new Error('Could not parse file.');
    }

    // Try to find the function at cursor
    let targetFunctionName: string | null = null;
    
    // Simple heuristic: get word at cursor. For a better implementation, 
    // we would use AST node position resolution like in variableTracker.
    const wordRange = document.getWordRangeAtPosition(position);
    if (wordRange) {
        targetFunctionName = document.getText(wordRange);
    }

    if (!targetFunctionName) {
         throw new Error('No function name found at cursor.');
    }

    DashboardPanel.createOrShow(context.extensionUri);
    DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: 'Building call graph...', current: 0, total: 100, percentage: 10 } });

    const start = Date.now();
    const graph = await buildCallGraph(rootPath, (current, total) => {
         DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: `Building call graph (${current}/${total})...`, current, total, percentage: 10 + Math.floor((current/total) * 70) } });
    });

    const nodeId = `${filePath}:${targetFunctionName}`;
    if (!graph.nodes.has(nodeId)) {
        // Try fallback if cursor is on an invocation rather than definition
        // We will just show the dashboard and an error state there
        DashboardPanel.postMessage({ type: 'callHierarchyResult', payload: { success: false, error: `Function ${targetFunctionName} not found in the call graph. Please place cursor on the function definition.`, duration: 0, timestamp: Date.now() } });
        return;
    }

    // We fetch both callees and callers
    const callees = getHierarchy(graph, nodeId, 'callees');
    const callers = getHierarchy(graph, nodeId, 'callers');

    if (callees && callers) {
        // Merge them for the UI to display
        const combined = {
            ...callees,
            callers: callers.callers
        };
        DashboardPanel.postMessage({ type: 'callHierarchyResult', payload: { success: true, data: combined, duration: Date.now() - start, timestamp: Date.now() } });
    }

  } catch (error: any) {
    vscode.window.showErrorMessage(`CodeScope: Failed to build call hierarchy. ${error.message}`);
    DashboardPanel.postMessage({ type: 'callHierarchyResult', payload: { success: false, error: error.message, duration: 0, timestamp: Date.now() } });
  }
}

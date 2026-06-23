/**
 * Command: Track Variable
 */

import * as vscode from 'vscode';
import { DashboardPanel } from '../panels/DashboardPanel';
import { VariableTracker } from '../analyzers/variableTracker';

export async function trackVariableCommand(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('CodeScope: Please open a file and place your cursor on a variable.');
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
    DashboardPanel.createOrShow(context.extensionUri);
    DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: 'Tracking variable usage...', current: 0, total: 100, percentage: 50 } });

    const start = Date.now();
    const tracker = new VariableTracker();
    const result = await tracker.trackVariable(rootPath, filePath, position.line + 1, position.character + 1);

    if (!result) {
        DashboardPanel.postMessage({ type: 'progress', payload: { status: 'complete', message: 'No variable found at cursor.', current: 100, total: 100, percentage: 100 } });
        vscode.window.showInformationMessage('CodeScope: No variable references found at cursor position.');
        return;
    }

    DashboardPanel.postMessage({ type: 'variableTrackResult', payload: { success: true, data: result, duration: Date.now() - start, timestamp: Date.now() } });

  } catch (error: any) {
    vscode.window.showErrorMessage(`CodeScope: Failed to track variable. ${error.message}`);
    DashboardPanel.postMessage({ type: 'variableTrackResult', payload: { success: false, error: error.message, duration: 0, timestamp: Date.now() } });
  }
}

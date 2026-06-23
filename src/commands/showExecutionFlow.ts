/**
 * Command: Show Execution Flow
 */

import * as vscode from 'vscode';
import { DashboardPanel } from '../panels/DashboardPanel';
import { analyzeExecutionFlow, findFunctionNodeByName } from '../analyzers/flowAnalyzer';
import { getParserService } from '../services/parserService';

export async function showExecutionFlowCommand(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('CodeScope: Please open a file and place your cursor on a function.');
    return;
  }

  const document = editor.document;
  const position = editor.selection.active;
  const filePath = document.uri.fsPath;

  try {
    const parser = getParserService();
    const parsed = parser.parseFile(filePath);
    if (!parsed) {
        throw new Error('Could not parse file.');
    }

    // Try to find the function at cursor
    let targetFunctionName: string | null = null;
    const wordRange = document.getWordRangeAtPosition(position);
    if (wordRange) {
        targetFunctionName = document.getText(wordRange);
    }

    if (!targetFunctionName) {
         throw new Error('No function name found at cursor.');
    }

    const funcNode = findFunctionNodeByName(parsed.sourceFile, targetFunctionName);
    if (!funcNode) {
        vscode.window.showErrorMessage(`CodeScope: Could not find function "${targetFunctionName}" in the AST.`);
        return;
    }

    DashboardPanel.createOrShow(context.extensionUri);
    DashboardPanel.postMessage({ type: 'progress', payload: { status: 'running', message: 'Building control flow graph...', current: 0, total: 100, percentage: 50 } });

    const start = Date.now();
    const flowResult = analyzeExecutionFlow(funcNode, targetFunctionName, parsed.sourceFile, filePath);

    DashboardPanel.postMessage({ type: 'executionFlowResult', payload: { success: true, data: flowResult, duration: Date.now() - start, timestamp: Date.now() } });

  } catch (error: any) {
    vscode.window.showErrorMessage(`CodeScope: Failed to generate execution flow. ${error.message}`);
    DashboardPanel.postMessage({ type: 'executionFlowResult', payload: { success: false, error: error.message, duration: 0, timestamp: Date.now() } });
  }
}

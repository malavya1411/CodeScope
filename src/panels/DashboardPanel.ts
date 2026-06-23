/**
 * Dashboard Panel — Main webview panel controller for CodeScope.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { PANEL_IDS } from '../config/constants';
import { generateWebviewHTML, getNonce } from '../utils/theme';
import { getThemeService } from '../services/themeService';
import { WebviewMessage, ExtensionMessage } from '../models/analysis';

export class DashboardPanel {
  public static currentPanel: DashboardPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => this._handleMessage(message),
      null,
      this._disposables
    );

    // Subscribe to theme changes
    this._disposables.push({
      dispose: getThemeService().subscribe((theme) => {
        this.postMessage({ type: 'themeChanged', payload: theme });
      })
    });
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      PANEL_IDS.dashboard,
      'CodeScope Dashboard',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist'),
          vscode.Uri.joinPath(extensionUri, 'webview', 'dist')
        ],
        retainContextWhenHidden: true,
      }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri);
  }

  public static postMessage(message: ExtensionMessage) {
    DashboardPanel.currentPanel?._panel.webview.postMessage(message);
  }

  public postMessage(message: ExtensionMessage) {
    this._panel.webview.postMessage(message);
  }

  private _handleMessage(message: WebviewMessage) {
    switch (message.type) {
      case 'analyzeFile':
        vscode.commands.executeCommand('codescope.analyzeFile', message.payload);
        break;
      case 'analyzeProject':
        vscode.commands.executeCommand('codescope.analyzeProject');
        break;
      case 'getDependencyGraph':
         vscode.commands.executeCommand('codescope.dependencyGraph');
         break;
      case 'getComplexityReport':
         vscode.commands.executeCommand('codescope.complexityAnalysis');
         break;
      case 'navigateToFile': {
        const payload = message.payload as { filePath: string; line?: number; column?: number };
        if (payload.filePath) {
             const uri = vscode.Uri.file(path.resolve(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', payload.filePath));
             vscode.workspace.openTextDocument(uri).then(doc => {
                 vscode.window.showTextDocument(doc).then(editor => {
                     if (payload.line) {
                         const pos = new vscode.Position(payload.line - 1, (payload.column || 1) - 1);
                         editor.selection = new vscode.Selection(pos, pos);
                         editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
                     }
                 });
             });
        }
        break;
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    
    // Note: In development, we might use Vite dev server URL. 
    // For production extension, we point to the built files in webview/dist.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist', 'assets', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist', 'assets', 'index.css')
    );

    const nonce = getNonce();
    const theme = getThemeService().getCurrentTheme();

    this._panel.webview.html = generateWebviewHTML(
        scriptUri,
        styleUri,
        nonce,
        theme.css,
        webview.cspSource
    );
  }

  public dispose() {
    DashboardPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

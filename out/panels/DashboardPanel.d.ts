/**
 * Dashboard Panel — Main webview panel controller for CodeScope.
 */
import * as vscode from 'vscode';
import { ExtensionMessage } from '../models/analysis';
export declare class DashboardPanel {
    static currentPanel: DashboardPanel | undefined;
    private readonly _panel;
    private readonly _extensionUri;
    private _disposables;
    private constructor();
    static createOrShow(extensionUri: vscode.Uri): void;
    static postMessage(message: ExtensionMessage): void;
    postMessage(message: ExtensionMessage): void;
    private _handleMessage;
    private _update;
    dispose(): void;
}
//# sourceMappingURL=DashboardPanel.d.ts.map
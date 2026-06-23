/**
 * VS Code settings schema accessor — typed wrappers around workspace configuration.
 */
import * as vscode from 'vscode';
export interface CodeScopeSettings {
    analysis: {
        includeNodeModules: boolean;
        maxFiles: number;
        excludePatterns: string[];
    };
    complexity: {
        cyclomaticThreshold: number;
        cognitiveThreshold: number;
    };
    ui: {
        showInlineDecorations: boolean;
    };
    cache: {
        maxEntries: number;
    };
}
/**
 * Retrieve the current extension settings from VS Code workspace configuration.
 */
export declare function getSettings(): CodeScopeSettings;
/**
 * Watch for settings changes and invoke callback.
 */
export declare function onSettingsChange(callback: (settings: CodeScopeSettings) => void): vscode.Disposable;
//# sourceMappingURL=settings.d.ts.map
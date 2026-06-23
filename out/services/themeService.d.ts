/**
 * Theme service — broadcasts VS Code theme changes to all open webview panels.
 */
import * as vscode from 'vscode';
export interface ThemePayload {
    kind: 'dark' | 'light' | 'high-contrast';
    css: string;
}
type ThemeListener = (theme: ThemePayload) => void;
export declare class ThemeService implements vscode.Disposable {
    private readonly listeners;
    private readonly disposables;
    constructor();
    /** Subscribe to theme change events. Returns an unsubscribe function. */
    subscribe(listener: ThemeListener): () => void;
    /** Get the current theme payload. */
    getCurrentTheme(): ThemePayload;
    private broadcast;
    dispose(): void;
}
export declare function getThemeService(): ThemeService;
export {};
//# sourceMappingURL=themeService.d.ts.map
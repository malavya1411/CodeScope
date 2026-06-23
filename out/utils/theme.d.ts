/**
 * VS Code theme CSS variable extraction and synchronization utilities.
 */
import * as vscode from 'vscode';
export interface ThemeColors {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgHover: string;
    bgSelected: string;
    fgPrimary: string;
    fgSecondary: string;
    fgMuted: string;
    accent: string;
    accentHover: string;
    accentFg: string;
    border: string;
    borderLight: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    riskLow: string;
    riskMedium: string;
    riskHigh: string;
    riskCritical: string;
}
/**
 * Generate a CSS custom properties block that maps CodeScope variables
 * to VS Code theme variables. Injected into every webview.
 */
export declare function generateThemeCSS(): string;
/**
 * Get the current VS Code color theme kind as a string.
 */
export declare function getThemeKind(): 'dark' | 'light' | 'high-contrast';
/**
 * Generate the full webview HTML boilerplate with theme CSS injected.
 * Used by all panel controllers.
 */
export declare function generateWebviewHTML(scriptUri: vscode.Uri, styleUri: vscode.Uri, nonce: string, themeCSS: string, cspSource: string, initialData?: unknown): string;
/** Generate a cryptographic nonce for CSP. */
export declare function getNonce(): string;
//# sourceMappingURL=theme.d.ts.map
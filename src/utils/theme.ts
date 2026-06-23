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
export function generateThemeCSS(): string {
  return `
:root {
  --cs-bg-primary:    var(--vscode-editor-background);
  --cs-bg-secondary:  var(--vscode-sideBar-background);
  --cs-bg-tertiary:   var(--vscode-panel-background);
  --cs-bg-hover:      var(--vscode-list-hoverBackground);
  --cs-bg-selected:   var(--vscode-list-activeSelectionBackground);

  --cs-fg-primary:    var(--vscode-editor-foreground);
  --cs-fg-secondary:  var(--vscode-descriptionForeground);
  --cs-fg-muted:      var(--vscode-disabledForeground);

  --cs-accent:        var(--vscode-button-background);
  --cs-accent-hover:  var(--vscode-button-hoverBackground);
  --cs-accent-fg:     var(--vscode-button-foreground);

  --cs-border:        var(--vscode-panel-border);
  --cs-border-light:  var(--vscode-widget-border);

  --cs-success:       var(--vscode-testing-iconPassed, #22c55e);
  --cs-warning:       var(--vscode-editorWarning-foreground, #eab308);
  --cs-error:         var(--vscode-editorError-foreground, #ef4444);
  --cs-info:          var(--vscode-editorInfo-foreground, #3b82f6);

  --cs-risk-low:      #22c55e;
  --cs-risk-medium:   #eab308;
  --cs-risk-high:     #f97316;
  --cs-risk-critical: #ef4444;

  --cs-font-mono:     var(--vscode-editor-font-family, 'Cascadia Code', monospace);
  --cs-font-ui:       var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  --cs-font-size:     var(--vscode-editor-font-size, 13px);

  --cs-scrollbar:         var(--vscode-scrollbarSlider-background);
  --cs-scrollbar-hover:   var(--vscode-scrollbarSlider-hoverBackground);

  --cs-input-bg:       var(--vscode-input-background);
  --cs-input-border:   var(--vscode-input-border);
  --cs-input-fg:       var(--vscode-input-foreground);

  --cs-badge-bg:       var(--vscode-badge-background);
  --cs-badge-fg:       var(--vscode-badge-foreground);
}
`.trim();
}

/**
 * Get the current VS Code color theme kind as a string.
 */
export function getThemeKind(): 'dark' | 'light' | 'high-contrast' {
  switch (vscode.window.activeColorTheme.kind) {
    case vscode.ColorThemeKind.Light:
      return 'light';
    case vscode.ColorThemeKind.HighContrast:
    case vscode.ColorThemeKind.HighContrastLight:
      return 'high-contrast';
    default:
      return 'dark';
  }
}

/**
 * Generate the full webview HTML boilerplate with theme CSS injected.
 * Used by all panel controllers.
 */
export function generateWebviewHTML(
  scriptUri: vscode.Uri,
  styleUri: vscode.Uri,
  nonce: string,
  themeCSS: string,
  cspSource: string,
  initialData?: unknown,
): string {
  const dataScript = initialData
    ? `<script nonce="${nonce}">window.__CODESCOPE_DATA__ = ${JSON.stringify(initialData)};</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'nonce-${nonce}' 'unsafe-eval' 'unsafe-inline'; img-src ${cspSource} data:; font-src ${cspSource};">
  <title>CodeScope</title>
  <style nonce="${nonce}">${themeCSS}</style>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="root"></div>
  ${dataScript}
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    window.vscodeAPI = vscode;
    window.addEventListener('error', (event) => {
      vscode.postMessage({ type: 'error', payload: event.message + ' at ' + event.filename + ':' + event.lineno });
    });
    window.addEventListener('unhandledrejection', (event) => {
      vscode.postMessage({ type: 'error', payload: 'Unhandled Rejection: ' + event.reason });
    });
  </script>
  <script type="module" crossorigin nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

/** Generate a cryptographic nonce for CSP. */
export function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

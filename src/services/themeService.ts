/**
 * Theme service — broadcasts VS Code theme changes to all open webview panels.
 */

import * as vscode from 'vscode';
import { generateThemeCSS, getThemeKind } from '../utils/theme';

export interface ThemePayload {
  kind: 'dark' | 'light' | 'high-contrast';
  css: string;
}

type ThemeListener = (theme: ThemePayload) => void;

export class ThemeService implements vscode.Disposable {
  private readonly listeners: Set<ThemeListener> = new Set();
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(() => {
        this.broadcast();
      }),
    );
  }

  /** Subscribe to theme change events. Returns an unsubscribe function. */
  subscribe(listener: ThemeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Get the current theme payload. */
  getCurrentTheme(): ThemePayload {
    return {
      kind: getThemeKind(),
      css: generateThemeCSS(),
    };
  }

  private broadcast(): void {
    const payload = this.getCurrentTheme();
    for (const listener of this.listeners) {
      listener(payload);
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.listeners.clear();
  }
}

let _themeService: ThemeService | null = null;

export function getThemeService(): ThemeService {
  if (!_themeService) {
    _themeService = new ThemeService();
  }
  return _themeService;
}

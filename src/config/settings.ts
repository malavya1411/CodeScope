/**
 * VS Code settings schema accessor — typed wrappers around workspace configuration.
 */

import * as vscode from 'vscode';
import { EXTENSION_ID } from './constants';

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
export function getSettings(): CodeScopeSettings {
  const config = vscode.workspace.getConfiguration(EXTENSION_ID);

  return {
    analysis: {
      includeNodeModules: config.get<boolean>('analysis.includeNodeModules', false),
      maxFiles: config.get<number>('analysis.maxFiles', 5000),
      excludePatterns: config.get<string[]>('analysis.excludePatterns', [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
      ]),
    },
    complexity: {
      cyclomaticThreshold: config.get<number>('complexity.cyclomaticThreshold', 10),
      cognitiveThreshold: config.get<number>('complexity.cognitiveThreshold', 15),
    },
    ui: {
      showInlineDecorations: config.get<boolean>('ui.showInlineDecorations', true),
    },
    cache: {
      maxEntries: config.get<number>('cache.maxEntries', 1000),
    },
  };
}

/**
 * Watch for settings changes and invoke callback.
 */
export function onSettingsChange(callback: (settings: CodeScopeSettings) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(EXTENSION_ID)) {
      callback(getSettings());
    }
  });
}

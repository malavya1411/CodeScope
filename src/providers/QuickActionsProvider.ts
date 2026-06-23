import * as vscode from 'vscode';
import { COMMANDS } from '../config/constants';

export class QuickActionItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly commandId: string,
    public readonly iconName: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.command = {
      title: label,
      command: commandId
    };
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
}

export class QuickActionsProvider implements vscode.TreeDataProvider<QuickActionItem> {
  getTreeItem(element: QuickActionItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: QuickActionItem): Thenable<QuickActionItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    return Promise.resolve([
      new QuickActionItem('Open Dashboard', COMMANDS.showDashboard, 'dashboard'),
      new QuickActionItem('Analyze Repository', COMMANDS.analyzeProject, 'repo'),
      new QuickActionItem('Show Dependency Graph', COMMANDS.dependencyGraph, 'type-hierarchy'),
      new QuickActionItem('Show Complexity Report', COMMANDS.complexityAnalysis, 'graph')
    ]);
  }
}

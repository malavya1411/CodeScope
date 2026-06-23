import * as vscode from 'vscode';
export declare class QuickActionItem extends vscode.TreeItem {
    readonly label: string;
    readonly commandId: string;
    readonly iconName: string;
    constructor(label: string, commandId: string, iconName: string);
}
export declare class QuickActionsProvider implements vscode.TreeDataProvider<QuickActionItem> {
    getTreeItem(element: QuickActionItem): vscode.TreeItem;
    getChildren(element?: QuickActionItem): Thenable<QuickActionItem[]>;
}
//# sourceMappingURL=QuickActionsProvider.d.ts.map
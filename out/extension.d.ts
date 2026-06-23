/**
 * Extension entry point — activates features and registers commands.
 */
import * as vscode from 'vscode';
import { getParserService } from './services/parserService';
import { getCacheService } from './services/cacheService';
import { getIndexService } from './services/indexService';
export declare function activate(context: vscode.ExtensionContext): {
    getParserService: typeof getParserService;
    getCacheService: typeof getCacheService;
    getIndexService: typeof getIndexService;
};
export declare function deactivate(): void;
//# sourceMappingURL=extension.d.ts.map
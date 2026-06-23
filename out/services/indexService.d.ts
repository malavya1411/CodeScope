/**
 * Index service — project-wide symbol index for O(1) lookups.
 * Maps symbol names to file locations and types.
 */
import * as vscode from 'vscode';
import { Location } from '../models/types';
export type SymbolKind = 'function' | 'class' | 'variable' | 'type' | 'interface' | 'enum' | 'method' | 'property';
export interface SymbolEntry {
    name: string;
    kind: SymbolKind;
    location: Location;
    filePath: string;
    isExported: boolean;
}
export interface FileSymbols {
    filePath: string;
    symbols: SymbolEntry[];
    indexedAt: number;
}
export declare class IndexService implements vscode.Disposable {
    /** symbolName → list of locations (a symbol may exist in multiple files) */
    private readonly nameIndex;
    /** filePath → list of symbols defined in that file */
    private readonly fileIndex;
    private readonly disposables;
    private _isBuilt;
    constructor();
    /**
     * Add all symbols from a file to the index.
     */
    indexFile(filePath: string, symbols: SymbolEntry[]): void;
    /**
     * Remove all symbol entries for a file.
     */
    removeFile(filePath: string): void;
    /** Find all definitions for a symbol name (O(1) lookup). */
    findSymbol(name: string): SymbolEntry[];
    /** Find all symbols in a specific file. */
    getFileSymbols(filePath: string): SymbolEntry[];
    /** Find all exported symbols. */
    getExportedSymbols(): SymbolEntry[];
    /** Search for symbols matching a partial name (prefix search). */
    searchSymbols(query: string, limit?: number): SymbolEntry[];
    get isBuilt(): boolean;
    set isBuilt(value: boolean);
    get totalSymbols(): number;
    get totalFiles(): number;
    clearAll(): void;
    dispose(): void;
}
export declare function getIndexService(): IndexService;
export declare function disposeIndexService(): void;
//# sourceMappingURL=indexService.d.ts.map
/**
 * Index service — project-wide symbol index for O(1) lookups.
 * Maps symbol names to file locations and types.
 */

import * as vscode from 'vscode';
import { Location } from '../models/types';

// ─── Symbol Types ─────────────────────────────────────────────────────────────

export type SymbolKind =
  | 'function'
  | 'class'
  | 'variable'
  | 'type'
  | 'interface'
  | 'enum'
  | 'method'
  | 'property';

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

// ─── Index Service ────────────────────────────────────────────────────────────

export class IndexService implements vscode.Disposable {
  /** symbolName → list of locations (a symbol may exist in multiple files) */
  private readonly nameIndex: Map<string, SymbolEntry[]> = new Map();

  /** filePath → list of symbols defined in that file */
  private readonly fileIndex: Map<string, FileSymbols> = new Map();

  private readonly disposables: vscode.Disposable[] = [];
  private _isBuilt = false;

  constructor() {
    // Invalidate on file save
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        this.removeFile(doc.uri.fsPath);
      }),
    );

    this.disposables.push(
      vscode.workspace.onDidDeleteFiles((e) => {
        for (const f of e.files) {
          this.removeFile(f.fsPath);
        }
      }),
    );
  }

  // ─── Index Management ───────────────────────────────────────────────────────

  /**
   * Add all symbols from a file to the index.
   */
  indexFile(filePath: string, symbols: SymbolEntry[]): void {
    // Remove stale entries first
    this.removeFile(filePath);

    const fileSymbols: FileSymbols = {
      filePath,
      symbols,
      indexedAt: Date.now(),
    };
    this.fileIndex.set(filePath, fileSymbols);

    for (const symbol of symbols) {
      const existing = this.nameIndex.get(symbol.name) ?? [];
      existing.push(symbol);
      this.nameIndex.set(symbol.name, existing);
    }
  }

  /**
   * Remove all symbol entries for a file.
   */
  removeFile(filePath: string): void {
    const fileSymbols = this.fileIndex.get(filePath);
    if (!fileSymbols) {return;}

    for (const symbol of fileSymbols.symbols) {
      const entries = this.nameIndex.get(symbol.name);
      if (entries) {
        const filtered = entries.filter((e) => e.filePath !== filePath);
        if (filtered.length === 0) {
          this.nameIndex.delete(symbol.name);
        } else {
          this.nameIndex.set(symbol.name, filtered);
        }
      }
    }

    this.fileIndex.delete(filePath);
  }

  // ─── Lookups ────────────────────────────────────────────────────────────────

  /** Find all definitions for a symbol name (O(1) lookup). */
  findSymbol(name: string): SymbolEntry[] {
    return this.nameIndex.get(name) ?? [];
  }

  /** Find all symbols in a specific file. */
  getFileSymbols(filePath: string): SymbolEntry[] {
    return this.fileIndex.get(filePath)?.symbols ?? [];
  }

  /** Find all exported symbols. */
  getExportedSymbols(): SymbolEntry[] {
    const result: SymbolEntry[] = [];
    for (const entries of this.nameIndex.values()) {
      result.push(...entries.filter((e) => e.isExported));
    }
    return result;
  }

  /** Search for symbols matching a partial name (prefix search). */
  searchSymbols(query: string, limit = 50): SymbolEntry[] {
    const lowerQuery = query.toLowerCase();
    const results: SymbolEntry[] = [];

    for (const [name, entries] of this.nameIndex.entries()) {
      if (name.toLowerCase().includes(lowerQuery)) {
        results.push(...entries);
        if (results.length >= limit) {break;}
      }
    }

    return results.slice(0, limit);
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  get isBuilt(): boolean {
    return this._isBuilt;
  }

  set isBuilt(value: boolean) {
    this._isBuilt = value;
  }

  get totalSymbols(): number {
    return Array.from(this.nameIndex.values()).reduce((sum, arr) => sum + arr.length, 0);
  }

  get totalFiles(): number {
    return this.fileIndex.size;
  }

  clearAll(): void {
    this.nameIndex.clear();
    this.fileIndex.clear();
    this._isBuilt = false;
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.clearAll();
  }
}

// Singleton
let _indexService: IndexService | null = null;

export function getIndexService(): IndexService {
  if (!_indexService) {
    _indexService = new IndexService();
  }
  return _indexService;
}

export function disposeIndexService(): void {
  _indexService?.dispose();
  _indexService = null;
}

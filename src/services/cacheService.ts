/**
 * LRU Cache implementation and service — file-level and project-level
 * analysis result caching with automatic invalidation on file save.
 */

import { CACHE_DEFAULTS } from '../config/constants';

// ─── LRU Cache ────────────────────────────────────────────────────────────────

interface CacheEntry<V> {
  key: string;
  value: V;
  timestamp: number;
  hits: number;
}

export class LRUCache<K, V> {
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly cache: Map<string, CacheEntry<V>>;

  constructor(maxSize = CACHE_DEFAULTS.maxEntries, ttlMs = CACHE_DEFAULTS.ttlMs) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  private key(k: K): string {
    return typeof k === 'string' ? k : JSON.stringify(k);
  }

  get(key: K): V | undefined {
    const k = this.key(key);
    const entry = this.cache.get(k);
    if (!entry) {return undefined;}

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(k);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(k);
    entry.hits++;
    this.cache.set(k, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    const k = this.key(key);

    if (this.cache.has(k)) {
      this.cache.delete(k);
    } else if (this.cache.size >= this.maxSize) {
      // Evict LRU (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {this.cache.delete(firstKey);}
    }

    this.cache.set(k, { key: k, value, timestamp: Date.now(), hits: 0 });
  }

  has(key: K): boolean {
    const k = this.key(key);
    const entry = this.cache.get(k);
    if (!entry) {return false;}
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(k);
      return false;
    }
    return true;
  }

  delete(key: K): void {
    this.cache.delete(this.key(key));
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  /** Get cache statistics for debugging. */
  stats(): { size: number; maxSize: number; ttlMs: number } {
    return { size: this.cache.size, maxSize: this.maxSize, ttlMs: this.ttlMs };
  }
}

// ─── Cache Service ────────────────────────────────────────────────────────────

import * as vscode from 'vscode';
import { FileAnalysis } from '../models/types';
import { ComplexityReport, DependencyReport } from '../models/analysis';

export class CacheService implements vscode.Disposable {
  private readonly fileCache: LRUCache<string, FileAnalysis>;
  private readonly complexityCache: LRUCache<string, ComplexityReport>;
  private readonly dependencyCache: LRUCache<string, DependencyReport>;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(maxEntries = CACHE_DEFAULTS.maxEntries) {
    // maxEntries is a CACHE_DEFAULTS value which is 1000. So we need to match or be compatible.
    this.fileCache = new LRUCache<string, FileAnalysis>(maxEntries);
    this.complexityCache = new LRUCache<string, ComplexityReport>(1000, 10 * 60 * 1000);
    this.dependencyCache = new LRUCache<string, DependencyReport>(1000, 10 * 60 * 1000);

    // Invalidate on file save
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        this.invalidateFile(doc.uri.fsPath);
      }),
    );

    // Invalidate on file delete
    this.disposables.push(
      vscode.workspace.onDidDeleteFiles((e) => {
        for (const file of e.files) {
          this.invalidateFile(file.fsPath);
        }
      }),
    );
  }

  // ─── File Analysis Cache ────────────────────────────────────────────────────

  getFileAnalysis(filePath: string): FileAnalysis | undefined {
    return this.fileCache.get(filePath);
  }

  setFileAnalysis(filePath: string, analysis: FileAnalysis): void {
    this.fileCache.set(filePath, analysis);
  }

  hasFileAnalysis(filePath: string): boolean {
    return this.fileCache.has(filePath);
  }

  invalidateFile(filePath: string): void {
    this.fileCache.delete(filePath);
    // Dependency and complexity reports are project-wide, invalidate them all
    this.dependencyCache.clear();
    this.complexityCache.clear();
  }

  // ─── Complexity Cache ───────────────────────────────────────────────────────

  getComplexityReport(rootPath: string): ComplexityReport | undefined {
    return this.complexityCache.get(rootPath);
  }

  setComplexityReport(rootPath: string, report: ComplexityReport): void {
    this.complexityCache.set(rootPath, report);
  }

  // ─── Dependency Cache ───────────────────────────────────────────────────────

  getDependencyReport(rootPath: string): DependencyReport | undefined {
    return this.dependencyCache.get(rootPath);
  }

  setDependencyReport(rootPath: string, report: DependencyReport): void {
    this.dependencyCache.set(rootPath, report);
  }

  // ─── Global Operations ──────────────────────────────────────────────────────

  clearAll(): void {
    this.fileCache.clear();
    this.complexityCache.clear();
    this.dependencyCache.clear();
  }

  stats() {
    return {
      fileCache: this.fileCache.stats(),
      complexityCache: this.complexityCache.stats(),
      dependencyCache: this.dependencyCache.stats(),
    };
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.clearAll();
  }
}

// Singleton
let _cacheService: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!_cacheService) {
    _cacheService = new CacheService();
  }
  return _cacheService;
}

export function disposeCacheService(): void {
  _cacheService?.dispose();
  _cacheService = null;
}

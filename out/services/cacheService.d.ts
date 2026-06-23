/**
 * LRU Cache implementation and service — file-level and project-level
 * analysis result caching with automatic invalidation on file save.
 */
export declare class LRUCache<K, V> {
    private readonly maxSize;
    private readonly ttlMs;
    private readonly cache;
    constructor(maxSize?: 1000, ttlMs?: number);
    private key;
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    has(key: K): boolean;
    delete(key: K): void;
    clear(): void;
    get size(): number;
    /** Get cache statistics for debugging. */
    stats(): {
        size: number;
        maxSize: number;
        ttlMs: number;
    };
}
import * as vscode from 'vscode';
import { FileAnalysis } from '../models/types';
import { ComplexityReport, DependencyReport } from '../models/analysis';
export declare class CacheService implements vscode.Disposable {
    private readonly fileCache;
    private readonly complexityCache;
    private readonly dependencyCache;
    private readonly disposables;
    constructor(maxEntries?: 1000);
    getFileAnalysis(filePath: string): FileAnalysis | undefined;
    setFileAnalysis(filePath: string, analysis: FileAnalysis): void;
    hasFileAnalysis(filePath: string): boolean;
    invalidateFile(filePath: string): void;
    getComplexityReport(rootPath: string): ComplexityReport | undefined;
    setComplexityReport(rootPath: string, report: ComplexityReport): void;
    getDependencyReport(rootPath: string): DependencyReport | undefined;
    setDependencyReport(rootPath: string, report: DependencyReport): void;
    clearAll(): void;
    stats(): {
        fileCache: {
            size: number;
            maxSize: number;
            ttlMs: number;
        };
        complexityCache: {
            size: number;
            maxSize: number;
            ttlMs: number;
        };
        dependencyCache: {
            size: number;
            maxSize: number;
            ttlMs: number;
        };
    };
    dispose(): void;
}
export declare function getCacheService(): CacheService;
export declare function disposeCacheService(): void;
//# sourceMappingURL=cacheService.d.ts.map
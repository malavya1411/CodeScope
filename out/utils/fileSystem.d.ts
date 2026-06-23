/**
 * File system helpers — glob scanning, file reading, .gitignore and
 * tsconfig.json exclusion support.
 */
/**
 * Scan a workspace root for all supported source files.
 * Respects user-configured exclusion patterns and default patterns.
 */
export declare function discoverSourceFiles(rootPath: string, excludePatterns?: string[]): Promise<string[]>;
/**
 * Read a file from disk as a UTF-8 string.
 * Returns null if the file cannot be read.
 */
export declare function readFile(filePath: string): string | null;
/**
 * Get file size in bytes. Returns 0 on error.
 */
export declare function getFileSize(filePath: string): number;
/**
 * Check if a file exists on disk.
 */
export declare function fileExists(filePath: string): boolean;
/**
 * Get a relative path from root. Falls back to basename if outside root.
 */
export declare function toRelativePath(filePath: string, rootPath: string): string;
/**
 * Determine if a file extension is supported by CodeScope.
 */
export declare function isSupportedFile(filePath: string): boolean;
export interface TsConfigPaths {
    baseUrl?: string;
    paths: Record<string, string[]>;
}
/**
 * Read and parse the closest tsconfig.json from the given directory.
 */
export declare function readTsConfigPaths(fromDir: string): TsConfigPaths;
/**
 * Resolve an import path to an absolute file path.
 * Handles relative imports, tsconfig path aliases, and index files.
 */
export declare function resolveImportPath(importSource: string, currentFile: string, rootPath: string, tsConfigPaths: TsConfigPaths): string | null;
export interface LineStats {
    totalLines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
}
/**
 * Count total, code, comment, and blank lines in source text.
 */
export declare function countLines(source: string): LineStats;
//# sourceMappingURL=fileSystem.d.ts.map
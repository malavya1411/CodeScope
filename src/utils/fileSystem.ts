/**
 * File system helpers — glob scanning, file reading, .gitignore and
 * tsconfig.json exclusion support.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SUPPORTED_EXTENSIONS, DEFAULT_EXCLUDE_PATTERNS } from '../config/constants';

// ─── File Discovery ───────────────────────────────────────────────────────────

/**
 * Scan a workspace root for all supported source files.
 * Respects user-configured exclusion patterns and default patterns.
 */
export async function discoverSourceFiles(
  rootPath: string,
  excludePatterns: string[] = DEFAULT_EXCLUDE_PATTERNS,
): Promise<string[]> {
  const excludeGlob = `{${excludePatterns.join(',')}}`;
  const includeGlob = '**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}';

  const uris = await vscode.workspace.findFiles(
    new vscode.RelativePattern(rootPath, includeGlob),
    new vscode.RelativePattern(rootPath, excludeGlob),
    5000,
  );

  return uris.map((u) => u.fsPath);
}

/**
 * Read a file from disk as a UTF-8 string.
 * Returns null if the file cannot be read.
 */
export function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Get file size in bytes. Returns 0 on error.
 */
export function getFileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * Check if a file exists on disk.
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// ─── Path Utilities ───────────────────────────────────────────────────────────

/**
 * Get a relative path from root. Falls back to basename if outside root.
 */
export function toRelativePath(filePath: string, rootPath: string): string {
  const rel = path.relative(rootPath, filePath);
  return rel.startsWith('..') ? path.basename(filePath) : rel;
}

/**
 * Determine if a file extension is supported by CodeScope.
 */
export function isSupportedFile(filePath: string): boolean {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

// ─── tsconfig.json Parsing ────────────────────────────────────────────────────

export interface TsConfigPaths {
  baseUrl?: string;
  paths: Record<string, string[]>;
}

/**
 * Read and parse the closest tsconfig.json from the given directory.
 */
export function readTsConfigPaths(fromDir: string): TsConfigPaths {
  const result: TsConfigPaths = { paths: {} };
  let current = fromDir;

  for (let i = 0; i < 10; i++) {
    const candidate = path.join(current, 'tsconfig.json');
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, 'utf-8');
        // Strip JSON comments (tsconfig allows them)
        const stripped = raw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const parsed = JSON.parse(stripped);
        const co = parsed?.compilerOptions ?? {};
        result.baseUrl = co.baseUrl;
        result.paths = co.paths ?? {};
        return result;
      } catch {
        // Ignore malformed tsconfig
      }
    }
    const parent = path.dirname(current);
    if (parent === current) {break;}
    current = parent;
  }

  return result;
}

// ─── Import Path Resolution ───────────────────────────────────────────────────

const EXTENSIONS_TO_TRY = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

/**
 * Resolve an import path to an absolute file path.
 * Handles relative imports, tsconfig path aliases, and index files.
 */
export function resolveImportPath(
  importSource: string,
  currentFile: string,
  rootPath: string,
  tsConfigPaths: TsConfigPaths,
): string | null {
  const currentDir = path.dirname(currentFile);

  // Relative import
  if (importSource.startsWith('.')) {
    return tryResolve(path.resolve(currentDir, importSource));
  }

  // tsconfig path alias
  for (const [alias, targets] of Object.entries(tsConfigPaths.paths)) {
    const pattern = alias.replace('*', '(.*)');
    const match = importSource.match(new RegExp(`^${pattern}$`));
    if (match) {
      for (const target of targets) {
        const resolved = target.replace('*', match[1] ?? '');
        const base = tsConfigPaths.baseUrl
          ? path.resolve(rootPath, tsConfigPaths.baseUrl, resolved)
          : path.resolve(rootPath, resolved);
        const found = tryResolve(base);
        if (found) {return found;}
      }
    }
  }

  // baseUrl import (non-relative, non-alias)
  if (tsConfigPaths.baseUrl && !importSource.startsWith('@')) {
    const base = path.resolve(rootPath, tsConfigPaths.baseUrl, importSource);
    const found = tryResolve(base);
    if (found) {return found;}
  }

  return null; // external / node_modules
}

function tryResolve(basePath: string): string | null {
  // Exact path
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {return basePath;}
  // Try adding extensions
  for (const ext of EXTENSIONS_TO_TRY) {
    const candidate = basePath + ext;
    if (fs.existsSync(candidate)) {return candidate;}
  }
  return null;
}

// ─── Line Counting ────────────────────────────────────────────────────────────

export interface LineStats {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
}

/**
 * Count total, code, comment, and blank lines in source text.
 */
export function countLines(source: string): LineStats {
  const lines = source.split('\n');
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      blankLines++;
      continue;
    }
    if (inBlockComment) {
      commentLines++;
      if (trimmed.includes('*/')) {inBlockComment = false;}
      continue;
    }
    if (trimmed.startsWith('/*') || trimmed.startsWith('/**')) {
      commentLines++;
      if (!trimmed.includes('*/')) {inBlockComment = true;}
      continue;
    }
    if (trimmed.startsWith('//')) {
      commentLines++;
      continue;
    }
    codeLines++;
  }

  return { totalLines: lines.length, codeLines, commentLines, blankLines };
}

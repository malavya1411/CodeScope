/**
 * Parser service — unified facade for TypeScript Compiler API and Babel parser.
 * Returns cached ASTs where possible.
 */

import * as path from 'path';
import * as ts from 'typescript';
import { LRUCache } from './cacheService';
import { TYPESCRIPT_EXTENSIONS, JAVASCRIPT_EXTENSIONS } from '../config/constants';
import { readFile } from '../utils/fileSystem';

// ─── AST Types ────────────────────────────────────────────────────────────────

export interface ParsedFile {
  filePath: string;
  sourceFile: ts.SourceFile;    // TypeScript Compiler API AST
  sourceCode: string;
  language: 'typescript' | 'javascript';
  parsedAt: number;
}

// ─── Parser Service ───────────────────────────────────────────────────────────

export class ParserService {
  private readonly astCache: LRUCache<string, ParsedFile>;
  private readonly compilerHost: ts.CompilerHost;

  constructor() {
    this.astCache = new LRUCache<string, ParsedFile>(1000, 10 * 60 * 1000);
    this.compilerHost = ts.createCompilerHost({});
  }

  /**
   * Parse a file and return its AST. Returns cached result if available.
   */
  parseFile(filePath: string): ParsedFile | null {
    if (this.astCache.has(filePath)) {
      return this.astCache.get(filePath)!;
    }

    const sourceCode = readFile(filePath);
    if (sourceCode === null) {return null;}

    const ext = path.extname(filePath).toLowerCase();
    const isTypeScript = TYPESCRIPT_EXTENSIONS.has(ext as '.ts');
    const isJavaScript = JAVASCRIPT_EXTENSIONS.has(ext as '.js');

    if (!isTypeScript && !isJavaScript) {return null;}

    const scriptKind = this.getScriptKind(ext);

    try {
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceCode,
        ts.ScriptTarget.ES2020,
        /*setParentNodes*/ true,
        scriptKind,
      );

      const parsed: ParsedFile = {
        filePath,
        sourceFile,
        sourceCode,
        language: isTypeScript ? 'typescript' : 'javascript',
        parsedAt: Date.now(),
      };

      this.astCache.set(filePath, parsed);
      return parsed;
    } catch (error) {
      console.error(`[CodeScope] Failed to parse ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse source code directly (without file I/O). Used for testing.
   */
  parseSourceCode(code: string, fileName: string): ParsedFile {
    const ext = path.extname(fileName).toLowerCase();
    const scriptKind = this.getScriptKind(ext);

    const sourceFile = ts.createSourceFile(
      fileName,
      code,
      ts.ScriptTarget.ES2020,
      true,
      scriptKind,
    );

    return {
      filePath: fileName,
      sourceFile,
      sourceCode: code,
      language: TYPESCRIPT_EXTENSIONS.has(ext as '.ts') ? 'typescript' : 'javascript',
      parsedAt: Date.now(),
    };
  }

  /**
   * Invalidate the cached AST for a specific file.
   */
  invalidate(filePath: string): void {
    this.astCache.delete(filePath);
  }

  /**
   * Clear all cached ASTs.
   */
  clearAll(): void {
    this.astCache.clear();
  }

  private getScriptKind(ext: string): ts.ScriptKind {
    switch (ext) {
      case '.ts':  return ts.ScriptKind.TS;
      case '.tsx': return ts.ScriptKind.TSX;
      case '.js':
      case '.mjs':
      case '.cjs': return ts.ScriptKind.JS;
      case '.jsx': return ts.ScriptKind.JSX;
      default:     return ts.ScriptKind.Unknown;
    }
  }
}

// ─── AST Traversal Helpers ────────────────────────────────────────────────────

/**
 * Walk every node in the AST, calling visitor for each.
 */
export function walkAST(
  node: ts.Node,
  visitor: (node: ts.Node) => void | 'stop',
): void {
  const result = visitor(node);
  if (result === 'stop') {return;}
  ts.forEachChild(node, (child) => {
    walkAST(child, visitor);
  });
}

/**
 * Collect all nodes matching a predicate.
 */
export function collectNodes<T extends ts.Node>(
  root: ts.Node,
  predicate: (node: ts.Node) => node is T,
): T[] {
  const results: T[] = [];
  walkAST(root, (node) => {
    if (predicate(node)) {results.push(node as T);}
  });
  return results;
}

/**
 * Get the text of a node trimmed of whitespace.
 */
export function getNodeText(node: ts.Node, sourceFile: ts.SourceFile): string {
  return node.getText(sourceFile).trim();
}

/**
 * Get line and column (1-indexed) for a node.
 */
export function getNodeLocation(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  filePath: string,
): { file: string; line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return { file: filePath, line: line + 1, column: character + 1 };
}

/**
 * Extract the JSDoc comment directly above a node.
 */
export function getJSDoc(node: ts.Node, sourceFile: ts.SourceFile): string | undefined {
  const jsDocNodes = (node as any).jsDoc;
  if (!jsDocNodes || jsDocNodes.length === 0) {return undefined;}
  return jsDocNodes
    .map((j: any) => j.getText(sourceFile))
    .join('\n')
    .replace(/^\/\*\*|\*\/$/g, '')
    .replace(/^\s*\*\s?/gm, '')
    .trim();
}

// Singleton
let _parserService: ParserService | null = null;

export function getParserService(): ParserService {
  if (!_parserService) {
    _parserService = new ParserService();
  }
  return _parserService;
}

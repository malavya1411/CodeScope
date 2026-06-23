/**
 * Parser service — unified facade for TypeScript Compiler API and Babel parser.
 * Returns cached ASTs where possible.
 */
import * as ts from 'typescript';
export interface ParsedFile {
    filePath: string;
    sourceFile: ts.SourceFile;
    sourceCode: string;
    language: 'typescript' | 'javascript';
    parsedAt: number;
}
export declare class ParserService {
    private readonly astCache;
    private readonly compilerHost;
    constructor();
    /**
     * Parse a file and return its AST. Returns cached result if available.
     */
    parseFile(filePath: string): ParsedFile | null;
    /**
     * Parse source code directly (without file I/O). Used for testing.
     */
    parseSourceCode(code: string, fileName: string): ParsedFile;
    /**
     * Invalidate the cached AST for a specific file.
     */
    invalidate(filePath: string): void;
    /**
     * Clear all cached ASTs.
     */
    clearAll(): void;
    private getScriptKind;
}
/**
 * Walk every node in the AST, calling visitor for each.
 */
export declare function walkAST(node: ts.Node, visitor: (node: ts.Node) => void | 'stop'): void;
/**
 * Collect all nodes matching a predicate.
 */
export declare function collectNodes<T extends ts.Node>(root: ts.Node, predicate: (node: ts.Node) => node is T): T[];
/**
 * Get the text of a node trimmed of whitespace.
 */
export declare function getNodeText(node: ts.Node, sourceFile: ts.SourceFile): string;
/**
 * Get line and column (1-indexed) for a node.
 */
export declare function getNodeLocation(node: ts.Node, sourceFile: ts.SourceFile, filePath: string): {
    file: string;
    line: number;
    column: number;
};
/**
 * Extract the JSDoc comment directly above a node.
 */
export declare function getJSDoc(node: ts.Node, sourceFile: ts.SourceFile): string | undefined;
export declare function getParserService(): ParserService;
//# sourceMappingURL=parserService.d.ts.map
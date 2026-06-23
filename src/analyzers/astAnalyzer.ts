/**
 * AST Analyzer — generic AST traversal, node extraction, and
 * top-level declaration enumeration using the TypeScript Compiler API.
 */

import * as ts from 'typescript';
import * as path from 'path';
import { getParserService, walkAST, collectNodes, getNodeText, getNodeLocation, getJSDoc } from '../services/parserService';
import { LanguageId } from '../models/types';
import { ImportInfo, ExportInfo, Location } from '../models/types';
import { TYPESCRIPT_EXTENSIONS } from '../config/constants';

// ─── Language Detection ───────────────────────────────────────────────────────

export function getLanguageId(filePath: string): LanguageId {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.ts':  return LanguageId.TypeScript;
    case '.tsx': return LanguageId.TypeScriptReact;
    case '.js':
    case '.mjs':
    case '.cjs': return LanguageId.JavaScript;
    case '.jsx': return LanguageId.JavaScriptReact;
    default:     return LanguageId.Unknown;
  }
}

// ─── Import Extraction ────────────────────────────────────────────────────────

export function extractImports(
  sourceFile: ts.SourceFile,
  filePath: string,
): ImportInfo[] {
  const imports: ImportInfo[] = [];

  walkAST(sourceFile, (node) => {
    // Static import: import X from 'y'
    if (ts.isImportDeclaration(node)) {
      const source = (node.moduleSpecifier as ts.StringLiteral).text;
      const clause = node.importClause;
      const specifiers: string[] = [];
      let isDefault = false;
      let isNamespace = false;

      if (clause) {
        if (clause.name) {
          specifiers.push(clause.name.text);
          isDefault = true;
        }
        if (clause.namedBindings) {
          if (ts.isNamespaceImport(clause.namedBindings)) {
            specifiers.push(`* as ${clause.namedBindings.name.text}`);
            isNamespace = true;
          } else {
            for (const el of clause.namedBindings.elements) {
              specifiers.push(el.name.text);
            }
          }
        }
      }

      const loc = getNodeLocation(node, sourceFile, filePath);
      imports.push({
        source,
        resolvedPath: null, // resolved later by dependencyAnalyzer
        specifiers,
        isDefault,
        isNamespace,
        isDynamic: false,
        location: loc,
      });
    }

    // Dynamic import: import('...')
    if (ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        const loc = getNodeLocation(node, sourceFile, filePath);
        imports.push({
          source: arg.text,
          resolvedPath: null,
          specifiers: [],
          isDefault: false,
          isNamespace: false,
          isDynamic: true,
          location: loc,
        });
      }
    }

    // require('...')
    if (ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require') {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        const loc = getNodeLocation(node, sourceFile, filePath);
        imports.push({
          source: arg.text,
          resolvedPath: null,
          specifiers: [],
          isDefault: true,
          isNamespace: false,
          isDynamic: false,
          location: loc,
        });
      }
    }
  });

  return imports;
}

// ─── Export Extraction ────────────────────────────────────────────────────────

export function extractExports(
  sourceFile: ts.SourceFile,
  filePath: string,
): ExportInfo[] {
  const exports: ExportInfo[] = [];

  walkAST(sourceFile, (node) => {
    // export default ...
    if (ts.isExportAssignment(node)) {
      const loc = getNodeLocation(node, sourceFile, filePath);
      exports.push({
        name: 'default',
        isDefault: true,
        isReexport: false,
        kind: 'unknown',
        location: loc,
      });
    }

    // export { X, Y } from '...' (re-export)
    if (ts.isExportDeclaration(node)) {
      const source = node.moduleSpecifier
        ? (node.moduleSpecifier as ts.StringLiteral).text
        : undefined;
      const loc = getNodeLocation(node, sourceFile, filePath);

      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) {
          exports.push({
            name: el.name.text,
            isDefault: false,
            isReexport: !!source,
            sourceModule: source,
            kind: 'unknown',
            location: loc,
          });
        }
      } else if (!node.exportClause && source) {
        // export * from '...'
        exports.push({
          name: '*',
          isDefault: false,
          isReexport: true,
          sourceModule: source,
          kind: 'unknown',
          location: loc,
        });
      }
    }

    // export function/class/const/let/var/type/interface/enum
    if (hasExportModifier(node)) {
      const loc = getNodeLocation(node, sourceFile, filePath);
      const isDefault = hasDefaultModifier(node);

      if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
        const name = node.name?.text ?? 'default';
        exports.push({ name, isDefault, isReexport: false, kind: 'function', location: loc });
      } else if (ts.isClassDeclaration(node)) {
        const name = node.name?.text ?? 'default';
        exports.push({ name, isDefault, isReexport: false, kind: 'class', location: loc });
      } else if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            exports.push({ name: decl.name.text, isDefault, isReexport: false, kind: 'variable', location: loc });
          }
        }
      } else if (ts.isTypeAliasDeclaration(node)) {
        exports.push({ name: node.name.text, isDefault, isReexport: false, kind: 'type', location: loc });
      } else if (ts.isInterfaceDeclaration(node)) {
        exports.push({ name: node.name.text, isDefault, isReexport: false, kind: 'interface', location: loc });
      } else if (ts.isEnumDeclaration(node)) {
        exports.push({ name: node.name.text, isDefault, isReexport: false, kind: 'enum', location: loc });
      }
    }
  });

  return exports;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasExportModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) {return false;}
  const mods = ts.getModifiers(node);
  return mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function hasDefaultModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) {return false;}
  const mods = ts.getModifiers(node);
  return mods?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) ?? false;
}

/**
 * Get the file-level JSDoc comment (first block comment in the file or @fileoverview).
 */
export function getFileOverviewComment(sourceFile: ts.SourceFile): string | undefined {
  const text = sourceFile.text;
  const match = text.match(/^\/\*\*[\s\S]*?\*\//);
  if (!match) {return undefined;}
  return match[0]
    .replace(/^\/\*\*|\*\/$/g, '')
    .replace(/^\s*\*\s?/gm, '')
    .trim();
}

// ─── Variable Extraction ──────────────────────────────────────────────────────

import { VariableInfo, VariableKind } from '../models/types';

export function extractTopLevelVariables(
  sourceFile: ts.SourceFile,
  filePath: string,
): VariableInfo[] {
  const variables: VariableInfo[] = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {continue;}

    const isExported = hasExportModifier(statement);
    const flags = statement.declarationList.flags;
    let kind: VariableKind;

    if (flags & ts.NodeFlags.Const) {
      kind = VariableKind.Const;
    } else if (flags & ts.NodeFlags.Let) {
      kind = VariableKind.Let;
    } else {
      kind = VariableKind.Var;
    }

    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) {continue;}
      const loc = getNodeLocation(decl, sourceFile, filePath);

      variables.push({
        name: decl.name.text,
        kind,
        type: decl.type ? getNodeText(decl.type, sourceFile) : 'unknown',
        isExported,
        location: loc,
      });
    }
  }

  return variables;
}

/**
 * Class Analyzer — extracts class declarations, their methods,
 * properties, inheritance, interfaces, and decorators.
 */

import * as ts from 'typescript';
import { walkAST, getNodeText, getNodeLocation, getJSDoc } from '../services/parserService';
import { ClassAnalysis, PropertyInfo, FunctionAnalysis } from '../models/types';
import { analyzeFunctions } from './functionAnalyzer';

// ─── Visibility ───────────────────────────────────────────────────────────────

function getVisibility(mods: readonly ts.Modifier[] | undefined): 'public' | 'private' | 'protected' {
  if (!mods) {return 'public';}
  if (mods.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) {return 'private';}
  if (mods.some((m) => m.kind === ts.SyntaxKind.ProtectedKeyword)) {return 'protected';}
  return 'public';
}

function hasModifier(mods: readonly ts.Modifier[] | undefined, kind: ts.SyntaxKind): boolean {
  return mods?.some((m) => m.kind === kind) ?? false;
}

// ─── Decorator Extraction ─────────────────────────────────────────────────────

function extractDecorators(node: ts.Node, sourceFile: ts.SourceFile): string[] {
  const mods = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  const decorators: string[] = [];

  if (ts.canHaveDecorators(node)) {
    const decs = ts.getDecorators(node);
    if (decs) {
      for (const dec of decs) {
        decorators.push(getNodeText(dec.expression, sourceFile));
      }
    }
  }

  return decorators;
}

// ─── Property Extraction ──────────────────────────────────────────────────────

function extractProperties(
  classNode: ts.ClassDeclaration | ts.ClassExpression,
  sourceFile: ts.SourceFile,
  filePath: string,
): PropertyInfo[] {
  const properties: PropertyInfo[] = [];

  for (const member of classNode.members) {
    if (!ts.isPropertyDeclaration(member)) {continue;}

    const mods = ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined;
    const name = ts.isIdentifier(member.name)
      ? member.name.text
      : getNodeText(member.name, sourceFile);

    properties.push({
      name,
      type: member.type ? getNodeText(member.type, sourceFile) : 'unknown',
      isStatic: hasModifier(mods, ts.SyntaxKind.StaticKeyword),
      isReadonly: hasModifier(mods, ts.SyntaxKind.ReadonlyKeyword),
      isOptional: !!member.questionToken,
      visibility: getVisibility(mods as readonly ts.Modifier[] | undefined),
      decorators: extractDecorators(member, sourceFile),
      location: getNodeLocation(member, sourceFile, filePath),
    });
  }

  return properties;
}

// ─── Base Class & Interfaces ──────────────────────────────────────────────────

function extractHeritage(
  classNode: ts.ClassDeclaration | ts.ClassExpression,
  sourceFile: ts.SourceFile,
): { baseClass?: string; interfaces: string[] } {
  let baseClass: string | undefined;
  const interfaces: string[] = [];

  if (!classNode.heritageClauses) {
    return { baseClass, interfaces };
  }

  for (const clause of classNode.heritageClauses) {
    for (const type of clause.types) {
      const name = getNodeText(type.expression, sourceFile);
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
        baseClass = name;
      } else {
        interfaces.push(name);
      }
    }
  }

  return { baseClass, interfaces };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Extract all class analyses from a source file.
 */
export function analyzeClasses(
  sourceFile: ts.SourceFile,
  filePath: string,
  relativePath: string,
): ClassAnalysis[] {
  const results: ClassAnalysis[] = [];
  let counter = 0;

  const isClassLike = (node: ts.Node): node is ts.ClassDeclaration | ts.ClassExpression =>
    ts.isClassDeclaration(node) || ts.isClassExpression(node);

  walkAST(sourceFile, (node) => {
    if (!isClassLike(node)) {return;}

    const classNode = node;
    const name =
      classNode.name?.text ??
      (ts.isVariableDeclaration(classNode.parent) && ts.isIdentifier(classNode.parent.name)
        ? classNode.parent.name.text
        : '<anonymous>');

    const mods = ts.canHaveModifiers(classNode) ? ts.getModifiers(classNode) : undefined;
    const isAbstract = hasModifier(mods, ts.SyntaxKind.AbstractKeyword);
    const isExported = hasModifier(mods, ts.SyntaxKind.ExportKeyword);

    const { baseClass, interfaces } = extractHeritage(classNode, sourceFile);
    const properties = extractProperties(classNode, sourceFile, filePath);
    const decorators = extractDecorators(classNode, sourceFile);

    // Analyze methods via functionAnalyzer (walk class body only)
    const syntheticSource = ts.createSourceFile(
      sourceFile.fileName,
      sourceFile.text,
      ts.ScriptTarget.ES2020,
      true,
    );

    // Collect method functions
    const methods: FunctionAnalysis[] = [];
    for (const member of classNode.members) {
      if (
        ts.isMethodDeclaration(member) ||
        ts.isConstructorDeclaration(member) ||
        ts.isGetAccessorDeclaration(member) ||
        ts.isSetAccessorDeclaration(member)
      ) {
        // We run the function analysis on the whole file, but filter by parent class
        // This approach reuses all the complexity analysis
      }
    }

    // Simpler: get all functions from the file and filter by class membership
    // We'll collect them directly from the class node
    const classFunctions = analyzeFunctions(classNode as unknown as ts.SourceFile, filePath, relativePath);
    methods.push(...classFunctions);

    counter++;

    results.push({
      id: `class_${counter}_${name}`,
      name,
      baseClass,
      interfaces,
      decorators,
      methods,
      properties,
      isAbstract,
      isExported,
      location: getNodeLocation(classNode, sourceFile, filePath),
    });
  });

  return results;
}

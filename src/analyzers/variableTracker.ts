/**
 * Variable Tracker — uses TypeScript Language Service to find references
 * to a variable and categorizes them (read, write, etc.).
 */

import * as ts from 'typescript';
import * as path from 'path';
import { VariableTrackResult, VariableReference, ReferenceKind, VariableKind, Location } from '../models/types';
import { discoverSourceFiles, readFile } from '../utils/fileSystem';
import { getSettings } from '../config/settings';

// ─── Language Service Host ────────────────────────────────────────────────────

class SimpleLanguageServiceHost implements ts.LanguageServiceHost {
  private files: Map<string, { version: number; content: string }> = new Map();
  private compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    allowJs: true,
  };

  addFile(filePath: string, content: string) {
    const existing = this.files.get(filePath);
    if (existing && existing.content === content) {return;}
    this.files.set(filePath, {
      version: existing ? existing.version + 1 : 1,
      content,
    });
  }

  getCompilationSettings() { return this.compilerOptions; }
  getScriptFileNames() { return Array.from(this.files.keys()); }
  getScriptVersion(fileName: string) { return this.files.get(fileName)?.version.toString() ?? '1'; }
  getScriptSnapshot(fileName: string) {
    const file = this.files.get(fileName);
    if (!file) {
      const content = readFile(fileName);
      if (content === null) {return undefined;}
      this.addFile(fileName, content);
      return ts.ScriptSnapshot.fromString(content);
    }
    return ts.ScriptSnapshot.fromString(file.content);
  }
  getCurrentDirectory() { return process.cwd(); }
  getDefaultLibFileName(options: ts.CompilerOptions) { return ts.getDefaultLibFilePath(options); }
  fileExists(path: string) { return this.files.has(path) || readFile(path) !== null; }
  readFile(path: string) { return this.files.get(path)?.content ?? readFile(path) ?? undefined; }
}

// ─── Tracker ──────────────────────────────────────────────────────────────────

export class VariableTracker {
  private host: SimpleLanguageServiceHost;
  private ls: ts.LanguageService;

  constructor() {
    this.host = new SimpleLanguageServiceHost();
    this.ls = ts.createLanguageService(this.host, ts.createDocumentRegistry());
  }

  async trackVariable(
    rootPath: string,
    filePath: string,
    line: number,
    column: number, // 1-indexed
  ): Promise<VariableTrackResult | null> {
    const settings = getSettings();
    const files = await discoverSourceFiles(rootPath, settings.analysis.excludePatterns);
    
    // Warm up the host with at least the target file
    const content = readFile(filePath);
    if (!content) {return null;}
    this.host.addFile(filePath, content);

    const sourceFile = this.ls.getProgram()?.getSourceFile(filePath);
    if (!sourceFile) {return null;}

    // Convert 1-indexed line/col to 0-indexed position
    const position = ts.getPositionOfLineAndCharacter(sourceFile, line - 1, column - 1);

    // Find references
    const refs = this.ls.findReferences(filePath, position);
    if (!refs || refs.length === 0) {return null;}

    // We take the first definition symbol
    const def = refs[0];
    const defName = this.getSymbolName(sourceFile, position) || 'unknown';
    
    const result: VariableTrackResult = {
      name: defName,
      variableKind: VariableKind.Var, // Will refine below
      type: 'unknown',                // Could use type checker to refine
      declaration: null as any,
      assignments: [],
      reads: [],
      modifications: [],
      usedInFunctions: [],
      issues: [],
    };

    const usedFunctions = new Set<string>();

    for (const refGroup of refs) {
      for (const ref of refGroup.references) {
        const refSourceFile = this.ls.getProgram()?.getSourceFile(ref.fileName);
        if (!refSourceFile) {continue;}
        
        // Ensure file is in host for text extraction
        if (!this.host.fileExists(ref.fileName)) {
             this.host.addFile(ref.fileName, refSourceFile.text);
        }

        const refNode = this.getNodeAtPosition(refSourceFile, ref.textSpan.start);
        if (!refNode) {continue;}

        const containingFn = this.getContainingFunction(refNode);
        if (containingFn) {usedFunctions.add(containingFn);}

        const snippetLineStart = refSourceFile.getLineAndCharacterOfPosition(refNode.getStart()).line;
        const snippetText = refSourceFile.text.split('\n')[snippetLineStart].trim();

        const loc: Location = {
          file: path.relative(rootPath, ref.fileName),
          line: snippetLineStart + 1,
          column: refSourceFile.getLineAndCharacterOfPosition(refNode.getStart()).character + 1,
        };

        const vRef: VariableReference = {
          kind: ReferenceKind.Read, // default
          location: loc,
          snippet: snippetText,
          containingFunction: containingFn,
        };

        if (ref.isWriteAccess) {
           if (this.isDeclaration(refNode)) {
               vRef.kind = ReferenceKind.Declaration;
               result.declaration = vRef;
               result.variableKind = this.detectVariableKind(refNode);
           } else if (this.isModification(refNode)) {
               vRef.kind = ReferenceKind.Modification;
               result.modifications.push(vRef);
           } else {
               vRef.kind = ReferenceKind.Assignment;
               result.assignments.push(vRef);
           }
        } else {
            vRef.kind = ReferenceKind.Read;
            result.reads.push(vRef);
        }
      }
    }

    result.usedInFunctions = Array.from(usedFunctions);

    // Basic issue detection
    if (result.variableKind === VariableKind.Const && result.assignments.length > 0) {
        result.issues.push('Const variable reassigned (possible error or bug)');
    }
    if (result.usedInFunctions.length > 5) {
        result.issues.push(`High coupling: variable used across ${result.usedInFunctions.length} functions`);
    }
    if (result.variableKind !== VariableKind.Const && result.assignments.length > 2) {
        result.issues.push(`Variable is reassigned frequently (${result.assignments.length} times)`);
    }

    // Fallback if no explicit declaration found (e.g. tracking a parameter)
    if (!result.declaration && result.reads.length > 0) {
        result.declaration = { ...result.reads[0], kind: ReferenceKind.Declaration };
        result.variableKind = VariableKind.Parameter;
    }

    return result.declaration ? result : null;
  }

  // Helpers
  private getNodeAtPosition(sourceFile: ts.SourceFile, position: number): ts.Node | null {
    let found: ts.Node | null = null;
    function visit(node: ts.Node) {
      if (node.getStart() <= position && position < node.getEnd()) {
        found = node;
        ts.forEachChild(node, visit);
      }
    }
    visit(sourceFile);
    return found;
  }

  private getSymbolName(sourceFile: ts.SourceFile, position: number): string | null {
      const node = this.getNodeAtPosition(sourceFile, position);
      if (node && ts.isIdentifier(node)) {
          return node.text;
      }
      return null;
  }

  private getContainingFunction(node: ts.Node): string | undefined {
    let curr: ts.Node | undefined = node.parent;
    while (curr) {
      if (ts.isFunctionDeclaration(curr) && curr.name) {
        return curr.name.text;
      }
      if (ts.isMethodDeclaration(curr) && ts.isIdentifier(curr.name)) {
        return curr.name.text;
      }
      if (ts.isArrowFunction(curr)) {
          if (ts.isVariableDeclaration(curr.parent) && ts.isIdentifier(curr.parent.name)) {
              return curr.parent.name.text;
          }
          return '<anonymous>';
      }
      curr = curr.parent;
    }
    return undefined;
  }

  private isDeclaration(node: ts.Node): boolean {
      return !!node.parent && (
          ts.isVariableDeclaration(node.parent) ||
          ts.isParameter(node.parent)
      );
  }

  private detectVariableKind(node: ts.Node): VariableKind {
       let curr: ts.Node | undefined = node.parent;
       while(curr) {
           if (ts.isVariableDeclarationList(curr)) {
               if (curr.flags & ts.NodeFlags.Const) {return VariableKind.Const;}
               if (curr.flags & ts.NodeFlags.Let) {return VariableKind.Let;}
               return VariableKind.Var;
           }
           if (ts.isParameter(curr)) {
               return VariableKind.Parameter;
           }
           curr = curr.parent;
       }
       return VariableKind.Var;
  }

  private isModification(node: ts.Node): boolean {
      // Very basic check: if it's a property access assignment like obj.prop = x
      // or a push call array.push(x)
      if (!node.parent) {return false;}
      if (ts.isPropertyAccessExpression(node.parent)) {
          return true; // We assume accessing properties of the tracked object might be modifying it
      }
      return false;
  }
}

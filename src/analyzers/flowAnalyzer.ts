/**
 * Flow Analyzer — builds a Control Flow Graph (CFG) from a function's AST.
 * Produces nodes and edges suitable for React Flow visualization.
 */

import * as ts from 'typescript';
import { CFGGraph, CFGNodeType, CFGEdgeType, FlowAnalysisResult } from '../models/graph';
import { createGraph, addNode, addEdge } from '../services/graphService';

// ─── CFG Builder ──────────────────────────────────────────────────────────────

let nodeCounter = 0;

function nextId(): string {
  return `cfg_${++nodeCounter}`;
}

function makeNode(
  id: string,
  type: CFGNodeType,
  label: string,
  code?: string,
  line?: number,
): Parameters<typeof addNode>[1] {
  return {
    id,
    label,
    data: { type, label, code, location: line ? { file: '', line, column: 0 } : undefined },
  };
}

// ─── Statement → CFG Node Mapping ────────────────────────────────────────────

class CFGBuilder {
  private graph: CFGGraph;
  private sourceFile: ts.SourceFile;
  private filePath: string;
  private decisionCount = 0;
  private loopCount = 0;

  constructor(sourceFile: ts.SourceFile, filePath: string) {
    this.graph = createGraph<CFGGraph['nodes'] extends Map<string, { data: infer D }> ? D : never, any>();
    this.sourceFile = sourceFile;
    this.filePath = filePath;
    nodeCounter = 0;
  }

  build(funcNode: ts.FunctionLikeDeclaration, functionName: string): FlowAnalysisResult {
    this.graph = createGraph();

    const startId = nextId();
    const endId = nextId();

    addNode(this.graph, makeNode(startId, CFGNodeType.Start, `START: ${functionName}`));
    addNode(this.graph, makeNode(endId, CFGNodeType.End, 'END'));

    if (funcNode.body && ts.isBlock(funcNode.body)) {
      const lastId = this.processBlock(funcNode.body.statements, startId, endId);
      if (lastId !== endId) {
        addEdge(this.graph, {
          id: `${lastId}→${endId}`,
          source: lastId,
          target: endId,
          data: { type: CFGEdgeType.Default },
        });
      }
    } else {
      addEdge(this.graph, {
        id: `${startId}→${endId}`,
        source: startId,
        target: endId,
        data: { type: CFGEdgeType.Default },
      });
    }

    return {
      functionName,
      filePath: this.filePath,
      cfg: this.graph,
      nodeCount: this.graph.nodes.size,
      edgeCount: this.graph.edges.length,
      decisionCount: this.decisionCount,
      loopCount: this.loopCount,
      maxPathLength: this.graph.nodes.size,
    };
  }

  private getLine(node: ts.Node): number {
    const { line } = this.sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return line + 1;
  }

  private getLabel(node: ts.Node): string {
    const text = node.getText(this.sourceFile).trim();
    return text.length > 60 ? text.slice(0, 57) + '...' : text;
  }

  /**
   * Process a sequence of statements. Returns the ID of the last node created.
   */
  private processBlock(statements: ts.NodeArray<ts.Statement>, entryId: string, exitId: string): string {
    let currentId = entryId;

    for (const stmt of statements) {
      currentId = this.processStatement(stmt, currentId, exitId);
    }

    return currentId;
  }

  private processStatement(stmt: ts.Statement, prevId: string, exitId: string): string {
    // IF statement
    if (ts.isIfStatement(stmt)) {
      return this.processIfStatement(stmt, prevId, exitId);
    }
    // FOR / WHILE / DO-WHILE loops
    if (ts.isForStatement(stmt) || ts.isForOfStatement(stmt) || ts.isForInStatement(stmt)) {
      return this.processLoop(stmt, prevId, exitId, 'for');
    }
    if (ts.isWhileStatement(stmt)) {
      return this.processLoop(stmt, prevId, exitId, 'while');
    }
    if (ts.isDoStatement(stmt)) {
      return this.processLoop(stmt, prevId, exitId, 'do-while');
    }
    // TRY-CATCH
    if (ts.isTryStatement(stmt)) {
      return this.processTryCatch(stmt, prevId, exitId);
    }
    // SWITCH
    if (ts.isSwitchStatement(stmt)) {
      return this.processSwitch(stmt, prevId, exitId);
    }
    // RETURN
    if (ts.isReturnStatement(stmt)) {
      const id = nextId();
      addNode(this.graph, makeNode(id, CFGNodeType.Return, `return${stmt.expression ? ' ' + this.getLabel(stmt.expression) : ''}`, undefined, this.getLine(stmt)));
      addEdge(this.graph, { id: `${prevId}→${id}`, source: prevId, target: id, data: { type: CFGEdgeType.Default } });
      addEdge(this.graph, { id: `${id}→${exitId}`, source: id, target: exitId, data: { type: CFGEdgeType.Default } });
      return exitId;
    }
    // THROW
    if (ts.isThrowStatement(stmt)) {
      const id = nextId();
      addNode(this.graph, makeNode(id, CFGNodeType.Throw, `throw ${this.getLabel(stmt.expression)}`, undefined, this.getLine(stmt)));
      addEdge(this.graph, { id: `${prevId}→${id}`, source: prevId, target: id, data: { type: CFGEdgeType.Default } });
      return id;
    }
    // BLOCK
    if (ts.isBlock(stmt)) {
      return this.processBlock(stmt.statements, prevId, exitId);
    }
    // EXPRESSION / CALL
    if (ts.isExpressionStatement(stmt)) {
      const expr = stmt.expression;
      const nodeType = ts.isCallExpression(expr) ? CFGNodeType.Call : CFGNodeType.Process;
      const id = nextId();
      addNode(this.graph, makeNode(id, nodeType, this.getLabel(stmt), undefined, this.getLine(stmt)));
      addEdge(this.graph, { id: `${prevId}→${id}`, source: prevId, target: id, data: { type: CFGEdgeType.Default } });
      return id;
    }

    // Generic process node for anything else
    const id = nextId();
    addNode(this.graph, makeNode(id, CFGNodeType.Process, this.getLabel(stmt), undefined, this.getLine(stmt)));
    addEdge(this.graph, { id: `${prevId}→${id}`, source: prevId, target: id, data: { type: CFGEdgeType.Default } });
    return id;
  }

  private processIfStatement(node: ts.IfStatement, prevId: string, exitId: string): string {
    this.decisionCount++;
    const decId = nextId();
    const mergeId = nextId();

    addNode(this.graph, makeNode(decId, CFGNodeType.Decision, `if (${this.getLabel(node.expression)})`, undefined, this.getLine(node)));
    addNode(this.graph, makeNode(mergeId, CFGNodeType.Process, '(merge)'));
    addEdge(this.graph, { id: `${prevId}→${decId}`, source: prevId, target: decId, data: { type: CFGEdgeType.Default } });

    // True branch
    const trueTailId = this.processStatement(node.thenStatement, decId, exitId);
    addEdge(this.graph, { id: `${decId}→true`, source: decId, target: this.firstChildId(decId) ?? trueTailId, label: 'YES', data: { type: CFGEdgeType.TrueBranch, label: 'YES' } });

    if (trueTailId !== exitId) {
      addEdge(this.graph, { id: `${trueTailId}→merge`, source: trueTailId, target: mergeId, data: { type: CFGEdgeType.Default } });
    }

    // False branch
    if (node.elseStatement) {
      const falseTailId = this.processStatement(node.elseStatement, decId, exitId);
      addEdge(this.graph, { id: `${decId}→false`, source: decId, target: this.firstChildId(decId) ?? falseTailId, label: 'NO', data: { type: CFGEdgeType.FalseBranch, label: 'NO' } });
      if (falseTailId !== exitId) {
        addEdge(this.graph, { id: `${falseTailId}→merge2`, source: falseTailId, target: mergeId, data: { type: CFGEdgeType.Default } });
      }
    } else {
      addEdge(this.graph, { id: `${decId}→mergeNo`, source: decId, target: mergeId, label: 'NO', data: { type: CFGEdgeType.FalseBranch, label: 'NO' } });
    }

    return mergeId;
  }

  private processLoop(node: ts.Statement, prevId: string, exitId: string, kind: string): string {
    this.loopCount++;
    const loopId = nextId();
    const bodyEntryId = nextId();
    const afterLoopId = nextId();

    addNode(this.graph, makeNode(loopId, CFGNodeType.Loop, `${kind} loop`, undefined, this.getLine(node)));
    addNode(this.graph, makeNode(bodyEntryId, CFGNodeType.Process, 'loop body'));
    addNode(this.graph, makeNode(afterLoopId, CFGNodeType.Process, 'after loop'));

    addEdge(this.graph, { id: `${prevId}→${loopId}`, source: prevId, target: loopId, data: { type: CFGEdgeType.Default } });
    addEdge(this.graph, { id: `${loopId}→body`, source: loopId, target: bodyEntryId, label: 'YES', data: { type: CFGEdgeType.TrueBranch, label: 'YES' } });
    addEdge(this.graph, { id: `${loopId}→after`, source: loopId, target: afterLoopId, label: 'NO', data: { type: CFGEdgeType.FalseBranch, label: 'NO' } });
    addEdge(this.graph, { id: `${bodyEntryId}→loop`, source: bodyEntryId, target: loopId, data: { type: CFGEdgeType.LoopBack } });

    return afterLoopId;
  }

  private processTryCatch(node: ts.TryStatement, prevId: string, exitId: string): string {
    const tryId = nextId();
    const mergeId = nextId();

    addNode(this.graph, makeNode(tryId, CFGNodeType.TryCatch, 'try', undefined, this.getLine(node)));
    addNode(this.graph, makeNode(mergeId, CFGNodeType.Process, '(finally/merge)'));

    addEdge(this.graph, { id: `${prevId}→${tryId}`, source: prevId, target: tryId, data: { type: CFGEdgeType.Default } });

    const tryTail = this.processBlock(node.tryBlock.statements, tryId, exitId);
    if (tryTail !== exitId) {
      addEdge(this.graph, { id: `${tryTail}→merge`, source: tryTail, target: mergeId, data: { type: CFGEdgeType.Default } });
    }

    if (node.catchClause) {
      const catchId = nextId();
      addNode(this.graph, makeNode(catchId, CFGNodeType.Process, `catch (${this.getLabel(node.catchClause.variableDeclaration ?? node.catchClause)})`, undefined, this.getLine(node.catchClause)));
      addEdge(this.graph, { id: `${tryId}→catch`, source: tryId, target: catchId, data: { type: CFGEdgeType.Exception } });
      addEdge(this.graph, { id: `${catchId}→merge2`, source: catchId, target: mergeId, data: { type: CFGEdgeType.Default } });
    }

    return mergeId;
  }

  private processSwitch(node: ts.SwitchStatement, prevId: string, exitId: string): string {
    this.decisionCount++;
    const switchId = nextId();
    const mergeId = nextId();

    addNode(this.graph, makeNode(switchId, CFGNodeType.Decision, `switch (${this.getLabel(node.expression)})`, undefined, this.getLine(node)));
    addNode(this.graph, makeNode(mergeId, CFGNodeType.Process, '(switch merge)'));
    addEdge(this.graph, { id: `${prevId}→${switchId}`, source: prevId, target: switchId, data: { type: CFGEdgeType.Default } });

    for (const clause of node.caseBlock.clauses) {
      const caseLabel = ts.isCaseClause(clause)
        ? `case ${this.getLabel(clause.expression)}`
        : 'default';
      const caseId = nextId();
      addNode(this.graph, makeNode(caseId, CFGNodeType.Process, caseLabel, undefined, this.getLine(clause)));
      addEdge(this.graph, { id: `${switchId}→${caseId}`, source: switchId, target: caseId, label: caseLabel, data: { type: CFGEdgeType.TrueBranch, label: caseLabel } });
      addEdge(this.graph, { id: `${caseId}→${mergeId}`, source: caseId, target: mergeId, data: { type: CFGEdgeType.Default } });
    }

    addEdge(this.graph, { id: `${switchId}→${mergeId}_default`, source: switchId, target: mergeId, data: { type: CFGEdgeType.Default } });

    return mergeId;
  }

  private firstChildId(_parentId: string): string | null {
    return null; // Simplified — direct edges used instead
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function analyzeExecutionFlow(
  funcNode: ts.FunctionLikeDeclaration,
  functionName: string,
  sourceFile: ts.SourceFile,
  filePath: string,
): FlowAnalysisResult {
  const builder = new CFGBuilder(sourceFile, filePath);
  return builder.build(funcNode, functionName);
}

/**
 * Find a function node by name in a source file.
 */
export function findFunctionNodeByName(
  sourceFile: ts.SourceFile,
  name: string,
): ts.FunctionLikeDeclaration | null {
  let found: ts.FunctionLikeDeclaration | null = null;

  function visit(node: ts.Node): void {
    if (found) {return;}

    const isFnLike =
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node);

    if (isFnLike) {
      const fn = node as ts.FunctionLikeDeclaration;
      let fnName = '';
      if (fn.name && ts.isIdentifier(fn.name)) {fnName = fn.name.text;}
      else if (ts.isVariableDeclaration(fn.parent) && ts.isIdentifier(fn.parent.name)) {
        fnName = fn.parent.name.text;
      }
      if (fnName === name) {
        found = fn;
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

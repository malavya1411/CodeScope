/**
 * Dependency Analyzer — scans all source files, extracts imports/exports,
 * resolves paths, builds a directed dependency graph, detects circular
 * dependencies, and ranks files by centrality.
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { getParserService } from '../services/parserService';
import {
  createGraph,
  addNode,
  addEdge,
  findCycles,
  calculateCentrality,
  topologicalSort,
} from '../services/graphService';
import { extractImports, extractExports } from './astAnalyzer';
import {
  resolveImportPath,
  readTsConfigPaths,
  toRelativePath,
  getFileSize,
  discoverSourceFiles,
  countLines,
  readFile,
} from '../utils/fileSystem';
import { inferArchitectureLayer } from '../utils/naming';
import { DependencyGraph, CircularDependency, DependencyNodeData, DependencyEdgeData } from '../models/graph';
import { ArchitectureLayer, RiskLevel } from '../models/types';
import { DependencyReport, UnusedExport, ImportedFileEntry, ImportingFileEntry } from '../models/analysis';
import { getSettings } from '../config/settings';

// ─── Build Dependency Graph ───────────────────────────────────────────────────

export async function buildDependencyGraph(
  rootPath: string,
  onProgress?: (current: number, total: number) => void,
): Promise<DependencyGraph> {
  const parser = getParserService();
  const settings = getSettings();
  const tsConfig = readTsConfigPaths(rootPath);
  const files = await discoverSourceFiles(rootPath, settings.analysis.excludePatterns);

  const graph = createGraph<DependencyNodeData, DependencyEdgeData>();

  // First pass: add all file nodes
  for (const filePath of files) {
    const relativePath = toRelativePath(filePath, rootPath);
    const ext = path.extname(filePath);
    const sizeBytes = getFileSize(filePath);
    const source = readFile(filePath);
    const linesOfCode = source ? countLines(source).codeLines : 0;

    addNode(graph, {
      id: filePath,
      label: relativePath,
      data: {
        filePath,
        relativePath,
        extension: ext,
        sizeBytes,
        linesOfCode,
        language: ['.ts', '.tsx', '.mts', '.cts'].includes(ext) ? 'typescript' : 'javascript',
        layer: ArchitectureLayer.Unknown, // resolved in second pass
        inDegree: 0,
        outDegree: 0,
        centrality: 0,
      },
    });
  }

  // Second pass: resolve imports and build edges
  let current = 0;
  for (const filePath of files) {
    current++;
    onProgress?.(current, files.length);

    const parsed = parser.parseFile(filePath);
    if (!parsed) {continue;}

    const imports = extractImports(parsed.sourceFile, filePath);
    const importSources = imports.map((i) => i.source);
    const layer = inferArchitectureLayer(filePath, importSources);

    // Update layer on node
    const node = graph.nodes.get(filePath);
    if (node) {
      node.data.layer = layer;
    }

    let outDegree = 0;

    for (const imp of imports) {
      if (imp.isDynamic || imp.source.startsWith('http')) {continue;}

      const resolved = resolveImportPath(imp.source, filePath, rootPath, tsConfig);
      if (!resolved || !graph.nodes.has(resolved)) {continue;} // external module

      // Avoid duplicate edges
      const edgeId = `${filePath}→${resolved}`;
      if (graph.edges.find((e) => e.id === edgeId)) {continue;}

      addEdge(graph, {
        id: edgeId,
        source: filePath,
        target: resolved,
        data: {
          specifiers: imp.specifiers,
          isDynamic: imp.isDynamic,
          isTypeOnly: false,
        },
      });

      outDegree++;
    }

    // Update degrees
    if (node) {
      node.data.outDegree = outDegree;
    }
  }

  // Third pass: calculate in-degrees
  for (const edge of graph.edges) {
    const target = graph.nodes.get(edge.target);
    if (target) {target.data.inDegree++;}
  }

  // Fourth pass: centrality
  const centrality = calculateCentrality(graph);
  for (const [id, score] of centrality.entries()) {
    const node = graph.nodes.get(id);
    if (node) {node.data.centrality = score;}
  }

  return graph;
}

// ─── Circular Dependencies ────────────────────────────────────────────────────

export function detectCircularDependencies(
  graph: DependencyGraph,
  rootPath: string,
): CircularDependency[] {
  const cycles = findCycles(graph);

  return cycles.map((cycle): CircularDependency => ({
    cycle: cycle.map((id) => toRelativePath(id, rootPath)),
    severity: cycle.length <= 2 ? RiskLevel.High : RiskLevel.Critical,
  }));
}

// ─── Unused Exports ───────────────────────────────────────────────────────────

export async function findUnusedExports(
  graph: DependencyGraph,
  rootPath: string,
): Promise<UnusedExport[]> {
  const parser = getParserService();
  const unused: UnusedExport[] = [];

  // Build a set of all imported specifiers: file→set of names
  const importedNames = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
    if (!importedNames.has(edge.target)) {
      importedNames.set(edge.target, new Set());
    }
    for (const spec of edge.data.specifiers) {
      importedNames.get(edge.target)!.add(spec);
    }
  }

  for (const [filePath, nodeEntry] of graph.nodes.entries()) {
    // Skip entry points (nothing imports them by definition)
    if (nodeEntry.data.inDegree === 0) {continue;}

    const parsed = parser.parseFile(filePath);
    if (!parsed) {continue;}

    const exports = extractExports(parsed.sourceFile, filePath);
    const imported = importedNames.get(filePath) ?? new Set();

    for (const exp of exports) {
      if (exp.name === '*' || exp.isDefault) {continue;}
      if (!imported.has(exp.name)) {
        unused.push({
          filePath: toRelativePath(filePath, rootPath),
          exportName: exp.name,
          line: exp.location.line,
        });
      }
    }
  }

  return unused;
}

// ─── Full Dependency Report ───────────────────────────────────────────────────

export async function buildDependencyReport(
  rootPath: string,
  onProgress?: (current: number, total: number) => void,
): Promise<DependencyReport> {
  const graph = await buildDependencyGraph(rootPath, onProgress);
  const circularDeps = detectCircularDependencies(graph, rootPath);
  const unusedExports = await findUnusedExports(graph, rootPath);

  // Most imported files (highest in-degree)
  const mostImported: ImportedFileEntry[] = Array.from(graph.nodes.values())
    .sort((a, b) => b.data.inDegree - a.data.inDegree)
    .slice(0, 10)
    .map((n) => ({
      filePath: n.data.filePath,
      relativePath: n.data.relativePath,
      importCount: n.data.inDegree,
    }));

  // Most importing files (highest out-degree)
  const mostImporting: ImportingFileEntry[] = Array.from(graph.nodes.values())
    .sort((a, b) => b.data.outDegree - a.data.outDegree)
    .slice(0, 10)
    .map((n) => ({
      filePath: n.data.filePath,
      relativePath: n.data.relativePath,
      dependencyCount: n.data.outDegree,
    }));

  return {
    projectPath: rootPath,
    graph,
    circularDependencies: circularDeps,
    unusedExports,
    mostImported,
    mostImporting,
    generatedAt: Date.now(),
  };
}

// ─── Reading Order ────────────────────────────────────────────────────────────

import { ReadingOrderEntry } from '../models/types';

export function generateReadingOrder(
  graph: DependencyGraph,
  rootPath: string,
): ReadingOrderEntry[] {
  const sorted = topologicalSort(graph) ?? Array.from(graph.nodes.keys());
  const result: ReadingOrderEntry[] = [];

  sorted.forEach((filePath, idx) => {
    const node = graph.nodes.get(filePath);
    if (!node) {return;}

    const relativePath = node.data.relativePath;
    let category: ReadingOrderEntry['category'] = 'foundation';

    if (node.data.inDegree === 0 && node.data.outDegree === 0) {
      category = 'foundation';
    } else if (node.data.outDegree === 0) {
      category = 'foundation'; // no deps → foundation
    } else if (node.data.inDegree > 5) {
      category = 'core'; // heavily depended upon → core
    } else if (node.data.layer === ArchitectureLayer.Frontend) {
      category = 'ui';
    } else if (node.data.layer === ArchitectureLayer.Service) {
      category = 'business-logic';
    }

    result.push({
      filePath,
      relativePath,
      category,
      reason: `In-degree: ${node.data.inDegree}, Out-degree: ${node.data.outDegree}`,
      order: idx + 1,
    });
  });

  return result;
}

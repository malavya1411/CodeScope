/**
 * Call Hierarchy Analyzer — builds a project-wide call graph to answer
 * "Who calls this?" and "What does this call?".
 */

import { CallGraph, CallHierarchyResult, CallHierarchyNode, CallNodeData, CallEdgeData } from '../models/graph';
import { createGraph, addNode, addEdge, bfs } from '../services/graphService';
import { getParserService } from '../services/parserService';
import { analyzeFunctions } from './functionAnalyzer';
import { resolveImportPath, discoverSourceFiles, readTsConfigPaths } from '../utils/fileSystem';
import { extractImports } from './astAnalyzer';
import { getSettings } from '../config/settings';

// ─── Build Call Graph ─────────────────────────────────────────────────────────

export async function buildCallGraph(
  rootPath: string,
  onProgress?: (current: number, total: number) => void,
): Promise<CallGraph> {
  const parser = getParserService();
  const settings = getSettings();
  const tsConfig = readTsConfigPaths(rootPath);
  const files = await discoverSourceFiles(rootPath, settings.analysis.excludePatterns);

  const graph = createGraph<CallNodeData, CallEdgeData>();
  
  // First pass: extract all functions as nodes
  const symbolMap = new Map<string, string>(); // exportedName@filePath -> nodeId
  
  let current = 0;
  for (const filePath of files) {
    current++;
    onProgress?.(current, files.length * 2); // Pass 1 of 2

    const parsed = parser.parseFile(filePath);
    if (!parsed) {continue;}

    const relativePath = filePath.replace(rootPath, '').substring(1);
    const fns = analyzeFunctions(parsed.sourceFile, filePath, relativePath);
    
    for (const fn of fns) {
      const nodeId = `${filePath}:${fn.name}`;
      
      addNode(graph, {
        id: nodeId,
        label: fn.name,
        data: {
          functionName: fn.name,
          filePath,
          relativePath,
          location: fn.location,
          isExternal: false,
          isRecursive: fn.isRecursive,
          callCount: 0,
        }
      });

      if (fn.isExported) {
          symbolMap.set(`${fn.name}@${filePath}`, nodeId);
      }
      // Handle default exports
      if (fn.isExported && fn.name === 'default') {
          // Sometimes functions are exported as default without a name, or the name is internal.
          // In astAnalyzer, we map 'export default' to name 'default'
          symbolMap.set(`default@${filePath}`, nodeId);
      }
    }
  }

  // Second pass: resolve calls to edges
  current = 0;
  for (const filePath of files) {
    current++;
    onProgress?.(files.length + current, files.length * 2);

    const parsed = parser.parseFile(filePath);
    if (!parsed) {continue;}

    const imports = extractImports(parsed.sourceFile, filePath);
    
    // Build local alias map: localName -> { source, importedName }
    const importMap = new Map<string, { resolvedFile: string | null; importedName: string }>();
    for (const imp of imports) {
        const resolvedPath = resolveImportPath(imp.source, filePath, rootPath, tsConfig);
        
        if (imp.isDefault) {
             importMap.set(imp.specifiers[0], { resolvedFile: resolvedPath, importedName: 'default' });
        } else {
            for (const spec of imp.specifiers) {
                // Simplified: assuming 'import { x as y }' isn't handled perfectly yet, just 'import { x }'
                importMap.set(spec, { resolvedFile: resolvedPath, importedName: spec });
            }
        }
    }

    const relativePath = filePath.replace(rootPath, '').substring(1);
    const fns = analyzeFunctions(parsed.sourceFile, filePath, relativePath);

    for (const fn of fns) {
        const sourceNodeId = `${filePath}:${fn.name}`;
        
        for (const call of fn.functionCalls) {
            let targetNodeId: string | null = null;
            let isExternalCall = false;

            // Is it an imported function?
            if (importMap.has(call.name)) {
                const info = importMap.get(call.name)!;
                if (info.resolvedFile && symbolMap.has(`${info.importedName}@${info.resolvedFile}`)) {
                    targetNodeId = symbolMap.get(`${info.importedName}@${info.resolvedFile}`)!;
                } else if (!info.resolvedFile) {
                    isExternalCall = true;
                }
            } 
            // Is it a local function in the same file?
            else if (!call.isInternal) {
                // If it has an object component like "logger.info", we used to check call.object here
                // but FunctionCallInfo does not have an 'object' property anymore, it uses 'sourceModule'.
                if (call.sourceModule && importMap.has(call.sourceModule)) {
                     const info = importMap.get(call.sourceModule)!;
                     if (!info.resolvedFile) {
                         isExternalCall = true;
                     }
                }
            }
            else {
                 const localId = `${filePath}:${call.name}`;
                 if (graph.nodes.has(localId)) {
                     targetNodeId = localId;
                 }
            }

            if (isExternalCall) {
                // Create a virtual external node
                const extId = `ext:${call.name}`;
                if (!graph.nodes.has(extId)) {
                     addNode(graph, {
                        id: extId,
                        label: call.name,
                        data: {
                            functionName: call.name,
                            filePath: 'external',
                            relativePath: 'external',
                            location: { file: '', line: 0, column: 0},
                            isExternal: true,
                            isRecursive: false,
                            callCount: 0
                        }
                     });
                }
                targetNodeId = extId;
            }

            if (targetNodeId) {
                const edgeId = `${sourceNodeId}→${targetNodeId}`;
                const existingEdge = graph.edges.find(e => e.id === edgeId);
                
                if (existingEdge) {
                    existingEdge.data.callCount++;
                    existingEdge.data.locations.push(call.location);
                } else {
                    addEdge(graph, {
                        id: edgeId,
                        source: sourceNodeId,
                        target: targetNodeId,
                        data: {
                            callCount: 1,
                            locations: [call.location]
                        }
                    });
                }

                const targetNode = graph.nodes.get(targetNodeId);
                if (targetNode) {
                    targetNode.data.callCount++;
                }
            }
        }
    }
  }

  return graph;
}

// ─── Hierarchy Extraction ─────────────────────────────────────────────────────

export function getHierarchy(
    graph: CallGraph, 
    startNodeId: string, 
    direction: 'callers' | 'callees',
    maxDepth = 10
): CallHierarchyResult | null {
    
    const startNode = graph.nodes.get(startNodeId);
    if (!startNode) {return null;}

    const root: CallHierarchyResult = {
        rootFunction: startNode.data.functionName,
        rootFile: startNode.data.relativePath,
        callers: [],
        callees: [],
        totalDepth: 0,
        externalCallCount: 0,
        recursiveCallCount: 0
    };

    const visitedPath = new Set<string>();

    function buildTree(nodeId: string, depth: number, buildDirection: 'callers' | 'callees'): CallHierarchyNode[] {
        if (depth > maxDepth) {return [];}
        
        // Cycle detection for this specific path
        const isRecursive = visitedPath.has(nodeId);
        
        const node = graph.nodes.get(nodeId);
        if (!node) {return [];}

        if (node.data.isExternal) {
            root.externalCallCount++;
        }
        if (isRecursive) {
            root.recursiveCallCount++;
        }

        root.totalDepth = Math.max(root.totalDepth, depth);

        const childrenNodes: CallHierarchyNode[] = [];
        
        if (!isRecursive) {
            visitedPath.add(nodeId);
            
            const nextNodes = buildDirection === 'callees' 
                ? graph.adjacency.get(nodeId) 
                : graph.reverseAdjacency.get(nodeId);
                
            if (nextNodes) {
                for (const nextId of nextNodes) {
                    const childNode = graph.nodes.get(nextId);
                    if (childNode) {
                         childrenNodes.push({
                            id: nextId,
                            functionName: childNode.data.functionName,
                            filePath: childNode.data.filePath,
                            relativePath: childNode.data.relativePath,
                            location: childNode.data.location,
                            isExternal: childNode.data.isExternal,
                            isRecursive: visitedPath.has(nextId),
                            depth: depth + 1,
                            children: buildTree(nextId, depth + 1, buildDirection)
                        });
                    }
                }
            }
            visitedPath.delete(nodeId);
        }

        return childrenNodes;
    }

    if (direction === 'callers' || direction === 'callees') {
        // Technically the prompt wants to support both views, 
        // we'll populate the requested one.
        if (direction === 'callers') {
            root.callers = buildTree(startNodeId, 0, 'callers');
        } else {
            root.callees = buildTree(startNodeId, 0, 'callees');
        }
    }

    return root;
}

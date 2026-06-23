/**
 * Architecture Analyzer — detects layers and identifies anti-patterns.
 */

import { DependencyGraph } from '../models/graph';
import { ArchitectureLayer, RiskLevel } from '../models/types';
import { ArchitectureLayerInfo, AntiPattern } from '../models/types';
import { toRelativePath } from '../utils/fileSystem';

// ─── Layer Rules ──────────────────────────────────────────────────────────────

// Defines which layers are *allowed* to depend on which other layers
const ALLOWED_DEPENDENCIES: Record<ArchitectureLayer, ArchitectureLayer[]> = {
  [ArchitectureLayer.Frontend]: [
    ArchitectureLayer.API,
    ArchitectureLayer.Service, // sometimes allowed in BFFs, but API is preferred
    ArchitectureLayer.Utility,
    ArchitectureLayer.Configuration,
    ArchitectureLayer.Unknown,
  ],
  [ArchitectureLayer.API]: [
    ArchitectureLayer.Service,
    ArchitectureLayer.Data, // sometimes acceptable, but Service is preferred
    ArchitectureLayer.Utility,
    ArchitectureLayer.Configuration,
    ArchitectureLayer.Unknown,
  ],
  [ArchitectureLayer.Service]: [
    ArchitectureLayer.Data,
    ArchitectureLayer.Utility,
    ArchitectureLayer.Configuration,
    ArchitectureLayer.Unknown,
  ],
  [ArchitectureLayer.Data]: [
    ArchitectureLayer.Utility,
    ArchitectureLayer.Configuration,
    ArchitectureLayer.Unknown,
  ],
  [ArchitectureLayer.Utility]: [
    ArchitectureLayer.Configuration,
    ArchitectureLayer.Unknown,
  ],
  [ArchitectureLayer.Configuration]: [
    ArchitectureLayer.Unknown,
  ],
  [ArchitectureLayer.Test]: [
    ArchitectureLayer.Frontend,
    ArchitectureLayer.API,
    ArchitectureLayer.Service,
    ArchitectureLayer.Data,
    ArchitectureLayer.Utility,
    ArchitectureLayer.Configuration,
    ArchitectureLayer.Unknown,
  ],
  [ArchitectureLayer.Unknown]: [
    ArchitectureLayer.Frontend,
    ArchitectureLayer.API,
    ArchitectureLayer.Service,
    ArchitectureLayer.Data,
    ArchitectureLayer.Utility,
    ArchitectureLayer.Configuration,
    ArchitectureLayer.Test,
    ArchitectureLayer.Unknown,
  ],
};

const LAYER_DISPLAY_NAMES: Record<ArchitectureLayer, string> = {
  [ArchitectureLayer.Frontend]: 'Frontend / UI Layer',
  [ArchitectureLayer.API]: 'API / Routing Layer',
  [ArchitectureLayer.Service]: 'Service / Business Logic Layer',
  [ArchitectureLayer.Data]: 'Data / Persistence Layer',
  [ArchitectureLayer.Utility]: 'Utility / Shared Layer',
  [ArchitectureLayer.Configuration]: 'Configuration Layer',
  [ArchitectureLayer.Test]: 'Test Layer',
  [ArchitectureLayer.Unknown]: 'Uncategorized',
};

// ─── Analysis ─────────────────────────────────────────────────────────────────

export function analyzeArchitecture(
  graph: DependencyGraph,
  rootPath: string,
): ArchitectureLayerInfo[] {
  const layerMap = new Map<ArchitectureLayer, ArchitectureLayerInfo>();

  // Initialize map
  for (const layer of Object.values(ArchitectureLayer)) {
    layerMap.set(layer, {
      layer,
      displayName: LAYER_DISPLAY_NAMES[layer],
      files: [],
      fileCount: 0,
      totalLines: 0,
      dependsOn: [],
      antiPatterns: [],
    });
  }

  // Populate files
  for (const node of graph.nodes.values()) {
    const info = layerMap.get(node.data.layer)!;
    info.files.push(node.data.relativePath);
    info.fileCount++;
    info.totalLines += node.data.linesOfCode;
  }

  // Populate dependencies and anti-patterns
  const dependsOnSets = new Map<ArchitectureLayer, Set<ArchitectureLayer>>();
  for (const layer of Object.values(ArchitectureLayer)) {
    dependsOnSets.set(layer, new Set());
  }

  for (const edge of graph.edges) {
    const sourceNode = graph.nodes.get(edge.source);
    const targetNode = graph.nodes.get(edge.target);
    if (!sourceNode || !targetNode) {continue;}

    const sourceLayer = sourceNode.data.layer;
    const targetLayer = targetNode.data.layer;

    if (sourceLayer !== targetLayer) {
      dependsOnSets.get(sourceLayer)!.add(targetLayer);

      // Check for anti-patterns
      const allowed = ALLOWED_DEPENDENCIES[sourceLayer];
      if (allowed && !allowed.includes(targetLayer) && sourceLayer !== ArchitectureLayer.Unknown && targetLayer !== ArchitectureLayer.Unknown) {
        
        // Special case: Frontend -> Data is a critical bypass
        const severity = (sourceLayer === ArchitectureLayer.Frontend && targetLayer === ArchitectureLayer.Data)
          ? RiskLevel.Critical
          : RiskLevel.High;

        layerMap.get(sourceLayer)!.antiPatterns.push({
          description: `Layer violation: ${sourceLayer} depends directly on ${targetLayer}`,
          sourceFile: sourceNode.data.relativePath,
          targetFile: targetNode.data.relativePath,
          severity,
        });
      }
    }
  }

  // Convert sets to arrays
  for (const [layer, deps] of dependsOnSets.entries()) {
    layerMap.get(layer)!.dependsOn = Array.from(deps);
  }

  // Return only populated layers (and Unknown if it has anti-patterns)
  return Array.from(layerMap.values())
    .filter((info) => info.fileCount > 0 || info.antiPatterns.length > 0)
    .sort((a, b) => {
        // Sort by typical architecture flow
        const order = [
            ArchitectureLayer.Frontend,
            ArchitectureLayer.API,
            ArchitectureLayer.Service,
            ArchitectureLayer.Data,
            ArchitectureLayer.Utility,
            ArchitectureLayer.Configuration,
            ArchitectureLayer.Test,
            ArchitectureLayer.Unknown
        ];
        return order.indexOf(a.layer) - order.indexOf(b.layer);
    });
}

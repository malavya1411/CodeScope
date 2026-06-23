import { useAnalysisData } from '../hooks/useAnalysisData';
import { MetricBadge, RiskBadge } from '../components/MetricBadge';
import { Box, Code2, AlertTriangle, Play, BookOpen, Layers } from 'lucide-react';
import { ArchitectureLayer, RiskLevel } from '@shared/types';

export function ProjectOverviewView() {
  const { state, actions, navigateToFile } = useAnalysisData();
  const data = state.projectData;

  if (!data) return <div className="p-6">No project data available. Run analysis first.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto h-full pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Box className="text-accent" />
          {data.name} Project Overview
        </h1>
        <div className="text-sm text-fg-secondary mt-1 flex gap-3">
          <span>Framework: <span className="text-accent">{data.projectType.framework}</span></span>
          <span>Language: <span className="text-accent">{data.projectType.language}</span></span>
          <span>Build Tool: <span className="text-accent">{data.projectType.buildTool}</span></span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricBadge label="Total Files" value={data.metrics.totalFiles} />
        <MetricBadge label="Total LOC" value={data.metrics.totalLines} />
        <MetricBadge label="Avg Complexity" value={data.metrics.averageComplexity} />
        <MetricBadge label="Circular Deps" value={data.metrics.circularDependencies} riskLevel={data.metrics.circularDependencies > 0 ? RiskLevel.High : RiskLevel.Low} />
        <MetricBadge label="High Risk Files" value={data.metrics.highRiskFiles} riskLevel={data.metrics.highRiskFiles > 0 ? RiskLevel.Medium : RiskLevel.Low} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Entry Points */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold flex items-center gap-2">
              <Play className="w-4 h-4" /> Entry Points ({data.entryPoints.length})
            </h2>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto text-sm space-y-2">
             {data.entryPoints.map((ep, i) => (
              <div key={i} className="flex justify-between items-center border-b border-border-light pb-2 last:border-0 cursor-pointer hover:bg-bg-hover p-1 rounded"
                   onClick={() => navigateToFile(ep.filePath)}>
                <span className="font-mono text-accent">{ep.relativePath}</span>
                <Code2 className="w-4 h-4 text-fg-muted" />
              </div>
            ))}
            {data.entryPoints.length === 0 && <p className="text-fg-muted">No entry points detected.</p>}
          </div>
        </div>

        {/* Issues */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" /> Project Issues ({data.issues.length})
            </h2>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto text-sm space-y-2">
             {data.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 border-b border-border-light pb-2 last:border-0">
                <AlertTriangle className={`w-4 h-4 mt-0.5 ${issue.severity === 'high' ? 'text-status-error' : 'text-status-warning'}`} />
                <div>
                   <span className="block font-medium">{issue.type}</span>
                   <span className="text-fg-secondary text-xs">{issue.message}</span>
                </div>
              </div>
            ))}
            {data.issues.length === 0 && <p className="text-fg-muted">No issues detected! 🎉</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Architecture Layers */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4" /> Architecture Layers
              </h2>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto text-sm space-y-4">
              {data.architectureLayers.map((layer, i) => (
                <div key={i} className="border-b border-border-light pb-3 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                     <span className="font-medium text-accent">{layer.displayName}</span>
                     <span className="text-xs bg-bg-tertiary px-2 py-0.5 rounded">{layer.fileCount} files</span>
                  </div>
                  {layer.antiPatterns.length > 0 && (
                      <div className="bg-status-error/10 text-status-error p-2 rounded text-xs mb-2">
                         {layer.antiPatterns.length} Layer Violations Detected
                      </div>
                  )}
                  {layer.dependsOn.length > 0 && (
                      <div className="text-xs text-fg-secondary">
                          Depends on: {layer.dependsOn.map(d => d).join(', ')}
                      </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reading Order */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Suggested Reading Order
              </h2>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto text-sm">
               <div className="space-y-1">
                 {data.suggestedReadingOrder.slice(0, 50).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 hover:bg-bg-hover p-1 rounded cursor-pointer"
                         onClick={() => navigateToFile(item.filePath)}>
                       <span className="text-fg-muted font-mono w-6 text-right">{item.order}.</span>
                       <span className="font-mono text-accent truncate flex-1">{item.relativePath}</span>
                       <span className="text-xs text-fg-secondary capitalize">{item.category}</span>
                    </div>
                 ))}
                 {data.suggestedReadingOrder.length > 50 && (
                     <div className="text-center text-xs text-fg-muted pt-2">+ {data.suggestedReadingOrder.length - 50} more files</div>
                 )}
               </div>
            </div>
          </div>
      </div>
    </div>
  );
}

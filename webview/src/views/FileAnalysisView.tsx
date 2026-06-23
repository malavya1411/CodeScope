import { useAnalysisData } from '../hooks/useAnalysisData';
import { MetricBadge, RiskBadge } from '../components/MetricBadge';
import { Code2, Package, GitMerge, Zap } from 'lucide-react';

export function FileAnalysisView() {
  const { state, navigateToFile } = useAnalysisData();
  const data = state.fileData;

  if (!data) return <div className="p-6">No data available. Run analysis first.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto h-full pb-20">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code2 className="text-accent" />
            {data.relativePath}
          </h1>
          <div className="text-sm text-fg-secondary mt-1 flex gap-3">
            <span>Layer: <span className="text-accent">{data.layer}</span></span>
            <span>Role: <span className="text-accent">{data.role}</span></span>
            <span>Language: <span className="text-accent">{data.language}</span></span>
          </div>
          {data.purpose && (
            <p className="mt-3 text-sm bg-bg-tertiary p-3 rounded border border-border-light">
              <strong>Purpose Inference:</strong> {data.purpose}
            </p>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBadge label="Total LOC" value={data.metrics.totalLines} />
        <MetricBadge label="Functions" value={data.metrics.functionCount} />
        <MetricBadge label="Max Complexity" value={data.metrics.maxComplexity} />
        <MetricBadge label="Avg Complexity" value={data.metrics.averageComplexity} />
      </div>

      {/* Functions List */}
      {data.functions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4" /> Functions
            </h2>
          </div>
          <div className="divide-y divide-border-light">
            {data.functions.map((fn, i) => (
              <div key={i} className="p-4 hover:bg-bg-hover transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 
                      className="font-mono font-medium text-accent cursor-pointer hover:underline"
                      onClick={() => navigateToFile(data.filePath, fn.location.line, fn.location.column)}
                    >
                      {fn.name}()
                    </h3>
                    <div className="text-xs text-fg-secondary mt-1 space-x-2">
                      <span>Line {fn.location.line}</span>
                      {fn.isAsync && <span className="text-status-info">async</span>}
                      {fn.isExported && <span className="text-status-warning">exported</span>}
                    </div>
                  </div>
                  <RiskBadge level={fn.riskLevel} />
                </div>
                
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-bg-tertiary p-2 rounded">
                    <span className="text-fg-muted block text-xs">Cyclomatic</span>
                    <span className="font-mono">{fn.cyclomaticComplexity}</span>
                  </div>
                  <div className="bg-bg-tertiary p-2 rounded">
                    <span className="text-fg-muted block text-xs">Cognitive</span>
                    <span className="font-mono">{fn.cognitiveComplexity}</span>
                  </div>
                  <div className="bg-bg-tertiary p-2 rounded">
                    <span className="text-fg-muted block text-xs">Est. Time</span>
                    <span className="font-mono">{fn.estimatedTimeComplexity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dependencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" /> Imports ({data.imports.length})
            </h2>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto text-sm space-y-2">
            {data.imports.map((imp, i) => (
              <div key={i} className="flex justify-between border-b border-border-light pb-1 last:border-0">
                <span className="font-mono text-fg-secondary">{imp.source}</span>
                <span className="text-fg-muted">{imp.specifiers.length} items</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold flex items-center gap-2">
              <GitMerge className="w-4 h-4" /> Exports ({data.exports.length})
            </h2>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto text-sm space-y-2">
            {data.exports.map((exp, i) => (
              <div key={i} className="flex justify-between border-b border-border-light pb-1 last:border-0">
                <span className="font-mono text-accent">{exp.name}</span>
                <span className="text-fg-muted">{exp.kind}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

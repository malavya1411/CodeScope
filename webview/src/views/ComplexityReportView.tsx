import { RiskLevel } from '@shared/types';
import { useAnalysisData } from '../hooks/useAnalysisData';
import { MetricBadge, RiskBadge } from '../components/MetricBadge';
import { Code2, Play, AlertTriangle } from 'lucide-react';

export function ComplexityReportView() {
  const { state, navigateToFile } = useAnalysisData();
  const data = state.complexityData;

  if (!data) return <div className="p-6">No complexity data available. Run analysis first.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto h-full pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Play className="text-accent" />
          Complexity Report
        </h1>
        <p className="text-sm text-fg-secondary mt-1">
          Analyzed {data.totalFunctions} functions across the project.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBadge label="Avg Cyclomatic" value={data.averageCyclomatic} />
        <MetricBadge label="Max Cyclomatic" value={data.maxCyclomatic} riskLevel={data.maxCyclomatic > 15 ? RiskLevel.High : RiskLevel.Low} />
        <MetricBadge label="Avg Cognitive" value={data.averageCognitive} />
        <MetricBadge label="Max Cognitive" value={data.maxCognitive} riskLevel={data.maxCognitive > 15 ? RiskLevel.High : RiskLevel.Low} />
      </div>

      {/* Risk Distribution */}
      <div className="card p-6 flex items-center justify-between">
          <h2 className="font-semibold w-1/4">Risk Distribution</h2>
          <div className="w-3/4 flex h-8 rounded overflow-hidden">
             {Object.entries(data.riskDistribution).map(([level, count]) => {
                 if (count === 0) return null;
                 const percentage = (count / data.totalFunctions) * 100;
                 let bgColor = 'bg-status-success';
                 if (level === 'medium') bgColor = 'bg-status-warning';
                 if (level === 'high') bgColor = 'bg-status-error opacity-80';
                 if (level === 'critical') bgColor = 'bg-status-error';

                 return (
                     <div 
                        key={level} 
                        style={{ width: `${percentage}%` }} 
                        className={`${bgColor} flex items-center justify-center text-[10px] font-bold text-white/90`}
                        title={`${level}: ${count} functions`}
                     >
                         {percentage > 5 ? `${Math.round(percentage)}%` : ''}
                     </div>
                 )
             })}
          </div>
      </div>

      {/* Top Complex Functions List */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-warning" /> 
            Top 50 Most Complex Functions
          </h2>
        </div>
        <div className="divide-y divide-border-light">
          {data.topComplexFunctions.map((fn, i) => (
            <div key={i} className="p-4 hover:bg-bg-hover transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div 
                   className="cursor-pointer group"
                   onClick={() => navigateToFile(fn.filePath, fn.line)}
                >
                  <h3 className="font-mono font-medium text-accent group-hover:underline flex items-center gap-2">
                    {fn.functionName}()
                  </h3>
                  <div className="text-xs text-fg-secondary mt-1 flex items-center gap-2">
                    <Code2 className="w-3 h-3" />
                    <span>{fn.relativePath}:{fn.line}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <RiskBadge level={fn.riskLevel} />
                    <span className="text-xs font-mono bg-bg-tertiary px-2 py-1 rounded">
                        Score: {fn.codeSmellScore.toFixed(1)}
                    </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm mt-3">
                <div className="bg-bg-tertiary p-2 rounded flex flex-col items-center">
                  <span className="text-fg-muted text-[10px] uppercase">Cyclomatic</span>
                  <span className="font-mono font-medium">{fn.cyclomaticComplexity}</span>
                </div>
                <div className="bg-bg-tertiary p-2 rounded flex flex-col items-center">
                  <span className="text-fg-muted text-[10px] uppercase">Cognitive</span>
                  <span className="font-mono font-medium">{fn.cognitiveComplexity}</span>
                </div>
                <div className="bg-bg-tertiary p-2 rounded flex flex-col items-center">
                  <span className="text-fg-muted text-[10px] uppercase">LOC</span>
                  <span className="font-mono font-medium">{fn.linesOfCode}</span>
                </div>
                 <div className="bg-bg-tertiary p-2 rounded flex flex-col items-center">
                  <span className="text-fg-muted text-[10px] uppercase">Time</span>
                  <span className="font-mono font-medium">{fn.estimatedTimeComplexity}</span>
                </div>
                 <div className="bg-bg-tertiary p-2 rounded flex flex-col items-center">
                  <span className="text-fg-muted text-[10px] uppercase">Space</span>
                  <span className="font-mono font-medium">{fn.estimatedSpaceComplexity}</span>
                </div>
              </div>

              {fn.issues.length > 0 && (
                  <div className="mt-3 text-xs space-y-1">
                      {fn.issues.map((issue, j) => (
                          <div key={j} className="text-status-warning flex items-center gap-1">
                              • {issue}
                          </div>
                      ))}
                  </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

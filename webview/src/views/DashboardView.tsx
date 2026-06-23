import { Play, FileSearch, Box, Activity } from 'lucide-react';
import { useAnalysisData } from '../hooks/useAnalysisData';

export function DashboardView() {
  const { actions, state } = useAnalysisData();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-fg-primary">CodeScope Analysis Engine</h1>
        <p className="text-fg-secondary">
          Run 100% offline static analysis on your codebase to uncover complexity, visualize architecture, and map dependencies.
        </p>
      </div>

      {state.progress.status === 'running' && (
        <div className="mb-8 bg-bg-tertiary p-4 rounded-md border border-border-light">
          <div className="flex justify-between mb-2 text-sm">
            <span>{state.progress.message}</span>
            <span>{state.progress.percentage}%</span>
          </div>
          <div className="w-full bg-bg-primary rounded-full h-2 overflow-hidden">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-300" 
              style={{ width: `${state.progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          title="Analyze Current File"
          description="Extract AST features, function complexity, and flow graph for the currently active editor."
          icon={FileSearch}
          onClick={actions.analyzeFile}
        />
        <ActionCard
          title="Project Overview"
          description="Scan the entire repository to build architecture maps and aggregate complexity metrics."
          icon={Box}
          onClick={actions.analyzeProject}
        />
        <ActionCard
          title="Dependency Graph"
          description="Visualize how files import each other and detect circular dependencies."
          icon={Activity}
          onClick={actions.getDependencyGraph}
        />
        <ActionCard
          title="Complexity Report"
          description="Identify the most complex and risky functions across the entire codebase."
          icon={Play}
          onClick={actions.getComplexityReport}
        />
      </div>
    </div>
  );
}

function ActionCard({ title, description, icon: Icon, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="text-left group card hover:border-accent transition-colors p-6 flex flex-col items-start gap-4"
    >
      <div className="p-3 rounded-lg bg-bg-tertiary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors">{title}</h3>
        <p className="text-sm text-fg-secondary">{description}</p>
      </div>
    </button>
  );
}

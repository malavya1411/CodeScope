import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { FileAnalysisView } from './views/FileAnalysisView';
import { ProjectOverviewView } from './views/ProjectOverviewView';
import { DependencyGraphView } from './views/DependencyGraphView';
import { ComplexityReportView } from './views/ComplexityReportView';
import { FlowViewer } from './views/FlowViewer';
// CallHierarchy and others can be added similarly
import { useAnalysisData } from './hooks/useAnalysisData';

function App() {
  const { state, setView } = useAnalysisData();

  const renderView = () => {
    switch (state.view) {
      case 'dashboard': return <DashboardView />;
      case 'file': return <FileAnalysisView />;
      case 'project': return <ProjectOverviewView />;
      case 'dependency': return <DependencyGraphView />;
      case 'complexity': return <ComplexityReportView />;
      case 'flow': return <FlowViewer />;
      case 'callHierarchy': return <div className="p-6">Call Hierarchy View (Placeholder - To be implemented)</div>;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary text-fg-primary">
      <Sidebar currentView={state.view} onViewChange={setView} />
      <main className="flex-1 overflow-y-auto relative">
        {state.error && (
          <div className="absolute top-0 left-0 right-0 bg-status-error text-white p-2 text-center text-sm z-50">
            Error: {state.error}
          </div>
        )}
        {renderView()}
      </main>
    </div>
  );
}

export default App;

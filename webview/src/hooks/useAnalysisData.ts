import { useState, useEffect } from 'react';
import { useExtensionMessage } from './useExtensionMessage';

// We import types directly from the extension source to ensure parity.
// This requires the vite alias we set up earlier.
import { FileAnalysis, ProjectAnalysis } from '@shared/types';
import { DependencyReport, ComplexityReport } from '@shared/analysis';
import { FlowAnalysisResult } from '@shared/graph';

type ActiveView = 'dashboard' | 'file' | 'project' | 'dependency' | 'complexity' | 'flow' | 'callHierarchy';

interface AppState {
  view: ActiveView;
  progress: { status: 'idle' | 'running' | 'complete'; message: string; percentage: number };
  fileData: FileAnalysis | null;
  projectData: ProjectAnalysis | null;
  dependencyData: DependencyReport | null;
  complexityData: ComplexityReport | null;
  flowData: FlowAnalysisResult | null;
  callHierarchyData: any | null; // typing left generic for brevity
  error: string | null;
}

export function useAnalysisData() {
  const { lastMessage, postMessage } = useExtensionMessage();
  const [state, setState] = useState<AppState>({
    view: 'dashboard',
    progress: { status: 'idle', message: '', percentage: 0 },
    fileData: null,
    projectData: null,
    dependencyData: null,
    complexityData: null,
    flowData: null,
    callHierarchyData: null,
    error: null,
  });

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'progress':
        setState(s => ({ ...s, progress: lastMessage.payload, error: null }));
        break;
      
      case 'fileAnalysisResult':
        if (lastMessage.payload.success) {
          setState(s => ({ 
            ...s, 
            view: 'file', 
            fileData: lastMessage.payload.data, 
            progress: { status: 'complete', message: 'Analysis complete', percentage: 100 }
          }));
        } else {
          setState(s => ({ ...s, error: lastMessage.payload.error, progress: { status: 'idle', message: '', percentage: 0 } }));
        }
        break;

      case 'projectAnalysisResult':
         if (lastMessage.payload.success) {
          setState(s => ({ 
            ...s, 
            view: 'project', 
            projectData: lastMessage.payload.data, 
            progress: { status: 'complete', message: 'Analysis complete', percentage: 100 }
          }));
        } else {
          setState(s => ({ ...s, error: lastMessage.payload.error, progress: { status: 'idle', message: '', percentage: 0 } }));
        }
        break;

      case 'dependencyGraphResult':
        if (lastMessage.payload.success) {
          setState(s => ({ 
            ...s, 
            view: 'dependency', 
            dependencyData: lastMessage.payload.data, 
            progress: { status: 'complete', message: 'Analysis complete', percentage: 100 }
          }));
        } else {
          setState(s => ({ ...s, error: lastMessage.payload.error, progress: { status: 'idle', message: '', percentage: 0 } }));
        }
        break;

      case 'complexityReportResult':
        if (lastMessage.payload.success) {
          setState(s => ({ 
            ...s, 
            view: 'complexity', 
            complexityData: lastMessage.payload.data, 
            progress: { status: 'complete', message: 'Analysis complete', percentage: 100 }
          }));
        } else {
          setState(s => ({ ...s, error: lastMessage.payload.error, progress: { status: 'idle', message: '', percentage: 0 } }));
        }
        break;

      case 'flowAnalysisResult':
        if (lastMessage.payload.success) {
          setState(s => ({ 
            ...s, 
            view: 'flow', 
            flowData: lastMessage.payload.data, 
            progress: { status: 'complete', message: 'Analysis complete', percentage: 100 }
          }));
        } else {
          setState(s => ({ ...s, error: lastMessage.payload.error, progress: { status: 'idle', message: '', percentage: 0 } }));
        }
        break;

      case 'callHierarchyResult':
        if (lastMessage.payload.success) {
          setState(s => ({ 
            ...s, 
            view: 'callHierarchy', 
            callHierarchyData: lastMessage.payload.data, 
            progress: { status: 'complete', message: 'Analysis complete', percentage: 100 }
          }));
        } else {
          setState(s => ({ ...s, error: lastMessage.payload.error, progress: { status: 'idle', message: '', percentage: 0 } }));
        }
        break;
    }
  }, [lastMessage]);

  const setView = (view: ActiveView) => setState(s => ({ ...s, view }));
  
  const navigateToFile = (filePath: string, line?: number, column?: number) => {
      postMessage({ type: 'navigateToFile', payload: { filePath, line, column } });
  };

  const actions = {
    analyzeFile: () => postMessage({ type: 'analyzeFile' }),
    analyzeProject: () => postMessage({ type: 'analyzeProject' }),
    getDependencyGraph: () => postMessage({ type: 'getDependencyGraph' }),
    getComplexityReport: () => postMessage({ type: 'getComplexityReport' }),
  };

  return { state, setView, actions, navigateToFile };
}

import { Activity, Code2, GitMerge, FileBarChart, Settings } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const items = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard' },
    { id: 'project', icon: FileBarChart, label: 'Project Overview' },
    { id: 'dependency', icon: GitMerge, label: 'Dependency Graph' },
    { id: 'complexity', icon: Code2, label: 'Complexity Report' },
  ];

  return (
    <div className="w-64 bg-bg-secondary border-r border-border-light flex flex-col h-full">
      <div className="p-4 border-b border-border-light">
        <h1 className="text-lg font-bold text-fg-primary flex items-center gap-2">
          <Code2 className="w-5 h-5 text-accent" />
          CodeScope
        </h1>
        <p className="text-xs text-fg-muted mt-1">Zero-AI Static Analysis</p>
      </div>
      
      <div className="flex-1 py-4 px-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive 
                  ? 'bg-bg-selected text-fg-primary font-medium' 
                  : 'text-fg-secondary hover:text-fg-primary hover:bg-bg-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-border-light">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-fg-secondary hover:text-fg-primary hover:bg-bg-hover transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
}

import { useAnalysisData } from '../hooks/useAnalysisData';
import { useCallback } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Share2 } from 'lucide-react';
import { CFGNodeType } from '@shared/graph';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 50;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

const getNodeColor = (type: CFGNodeType) => {
    switch(type) {
        case CFGNodeType.Start:
        case CFGNodeType.End:
            return 'bg-status-info text-white border-status-info';
        case CFGNodeType.Decision:
            return 'bg-status-warning/20 text-status-warning border-status-warning';
        case CFGNodeType.Loop:
            return 'bg-status-success/20 text-status-success border-status-success';
        case CFGNodeType.TryCatch:
        case CFGNodeType.Throw:
        case CFGNodeType.Return:
             return 'bg-status-error/20 text-status-error border-status-error';
        default:
             return 'bg-bg-tertiary text-fg-primary border-border-light';
    }
};

export function FlowViewer() {
  const { state, navigateToFile } = useAnalysisData();
  const data = state.flowData;

  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  if (data?.cfg) {
      for (const node of data.cfg.nodes.values()) {
          initialNodes.push({
              id: node.id,
              position: { x: 0, y: 0 }, 
              data: { 
                  label: (
                      <div className="flex flex-col text-center">
                          <span className="font-mono text-xs font-semibold">{node.data.type}</span>
                          <span className="font-sans text-xs truncate max-w-[180px]" title={node.data.label}>{node.data.label}</span>
                      </div>
                  ) 
              },
              className: `rounded border shadow-sm px-2 py-1 ${getNodeColor(node.data.type)}`
          });
      }

      for (const edge of data.cfg.edges) {
          initialEdges.push({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              label: edge.data.label,
              animated: edge.data.type === 'exception' || edge.data.type === 'loopBack',
              labelStyle: { fill: 'var(--cs-fg-secondary)', fontSize: 10, fontWeight: 'bold' },
              labelBgStyle: { fill: 'var(--cs-bg-primary)', fillOpacity: 0.8 },
              style: { stroke: 'var(--cs-border)' }
          });
      }
  }

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      'TB' // Top-Bottom layout for CFG
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onNodeDoubleClick = useCallback((event: any, node: Node) => {
      // Find original node data to get location
      const originalNode = data?.cfg.nodes.get(node.id);
      if (originalNode && originalNode.data.location && data) {
          navigateToFile(data.filePath, originalNode.data.location.line);
      }
  }, [data, navigateToFile]);

  if (!data) return <div className="p-6">No flow data available. Place your cursor on a function and run the Show Execution Flow command.</div>;

  return (
    <div className="h-full w-full flex flex-col">
       <div className="p-4 border-b border-border-light bg-bg-secondary flex justify-between items-center z-10 shadow-sm">
           <h1 className="text-lg font-bold flex items-center gap-2">
               <Share2 className="text-accent w-5 h-5" />
               Execution Flow: <span className="font-mono font-normal">{data.functionName}</span>
           </h1>
           <div className="text-sm text-fg-secondary flex gap-4">
               <span>Nodes: {data.nodeCount}</span>
               <span>Decisions: {data.decisionCount}</span>
               <span>Loops: {data.loopCount}</span>
           </div>
       </div>

       <div className="flex-1 bg-bg-primary">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDoubleClick={onNodeDoubleClick}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="var(--cs-border-light)" gap={16} />
            <Controls />
            <MiniMap 
                nodeStrokeColor={() => 'var(--cs-border)'}
                nodeColor={() => 'var(--cs-bg-tertiary)'}
                maskColor="rgba(0,0,0,0.2)"
            />
          </ReactFlow>
       </div>
    </div>
  );
}

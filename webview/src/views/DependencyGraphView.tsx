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

// We use dagre for auto-layout of the graph
import dagre from 'dagre';
import { GitMerge } from 'lucide-react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 50;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
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

export function DependencyGraphView() {
  const { state, navigateToFile } = useAnalysisData();
  const data = state.dependencyData;

  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  if (data?.graph) {
      // Map CodeScope graph models to ReactFlow models
      for (const node of data.graph.nodes.values()) {
          initialNodes.push({
              id: node.id,
              position: { x: 0, y: 0 }, // Layout will fix this
              data: { label: node.data.relativePath },
              style: {
                  background: 'var(--cs-bg-secondary)',
                  color: 'var(--cs-fg-primary)',
                  border: '1px solid var(--cs-border-light)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'var(--cs-font-mono)'
              }
          });
      }

      for (const edge of data.graph.edges) {
          initialEdges.push({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              animated: edge.data.isDynamic,
              style: { stroke: 'var(--cs-border)' }
          });
      }
  }

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onNodeDoubleClick = useCallback((event: any, node: Node) => {
      navigateToFile(node.id);
  }, [navigateToFile]);

  if (!data) return <div className="p-6">No dependency data available. Run analysis first.</div>;

  return (
    <div className="h-full w-full flex flex-col">
       <div className="p-4 border-b border-border-light bg-bg-secondary flex justify-between items-center z-10 shadow-sm">
           <h1 className="text-lg font-bold flex items-center gap-2">
               <GitMerge className="text-accent w-5 h-5" />
               Dependency Graph
           </h1>
           <div className="text-sm text-fg-secondary flex gap-4">
               <span>Nodes: {data.graph.nodes.size}</span>
               <span>Edges: {data.graph.edges.length}</span>
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

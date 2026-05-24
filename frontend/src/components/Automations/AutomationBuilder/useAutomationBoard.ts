import { useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, useReactFlow, addEdge, Connection, Node, Edge } from '@xyflow/react';
import { getLayoutedElements } from './utils/layout';
import { AppNode } from './types';

export interface UseAutomationBoardProps {
  initialNodes?: AppNode[];
  initialEdges?: Edge[];
  onStructureChange?: (nodes: AppNode[], edges: Edge[]) => void;
}

export function useAutomationBoard({
  initialNodes = [],
  initialEdges = [],
  onStructureChange,
}: UseAutomationBoardProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(getLayoutedElements(initialNodes, initialEdges));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  const prevInitialNodes = useRef(initialNodes);
  const prevInitialEdges = useRef(initialEdges);
  const lastStructureRef = useRef({ nodeCount: initialNodes.length, edgeCount: initialEdges.length });

  if (initialNodes !== prevInitialNodes.current || initialEdges !== prevInitialEdges.current) {
    prevInitialNodes.current = initialNodes;
    prevInitialEdges.current = initialEdges;
    const layouted = getLayoutedElements(initialNodes, initialEdges);
    setNodes(layouted);
    setEdges(initialEdges);
    lastStructureRef.current = { nodeCount: layouted.length, edgeCount: initialEdges.length };
  }

  // Automatically fit view when nodes change (e.g. after layout)
  useEffect(() => {
    if (nodes.length > 0) {
      window.requestAnimationFrame(() => {
        fitView({ duration: 400, padding: 0.15 });
      });
    }
  }, [nodes.length, fitView]);

  // Handle structural changes (deletions/healing) by recalculating layout
  useEffect(() => {
    if (nodes.length !== lastStructureRef.current.nodeCount || edges.length !== lastStructureRef.current.edgeCount) {
      lastStructureRef.current = { nodeCount: nodes.length, edgeCount: edges.length };
      const newNodes = getLayoutedElements(nodes as AppNode[], edges);
      setNodes((nds) => newNodes);
      if (onStructureChange) {
        prevInitialNodes.current = newNodes;
        prevInitialEdges.current = edges;
        onStructureChange(newNodes as AppNode[], edges);
      }
    }
  }, [nodes.length, edges.length, setNodes, edges, onStructureChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'automation' }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Clear other open elements when focusing a new node
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isRewriting: n.id === node.id ? n.data.isRewriting : false } })));
    setEdges((eds) => eds.map((e) => ({ ...e, data: { ...e.data, popoverOpened: false } })));

    fitView({
      nodes: [{ id: node.id }],
      duration: 600,
      padding: 0.6,
    });
  }, [fitView, setNodes, setEdges]);

  const onPaneClick = useCallback(() => {
    // Clear all open rewrite inputs and popovers when clicking the board background
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isRewriting: false } })));
    setEdges((eds) => eds.map((e) => ({ ...e, data: { ...e.data, popoverOpened: false } })));
    fitView({ duration: 600, padding: 0.15 });
  }, [fitView, setNodes, setEdges]);

  // Auto-center whenever the container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      // Use requestAnimationFrame to ensure the resize has finished and ReactFlow has updated its internal dimensions
      window.requestAnimationFrame(() => {
        fitView({ duration: 0, padding: 0.2 });
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fitView]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
    containerRef,
  };
}

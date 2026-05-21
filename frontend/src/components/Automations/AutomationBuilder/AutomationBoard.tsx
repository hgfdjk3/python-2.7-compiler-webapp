import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getLayoutedElements } from './utils/layout';
import { AutomationEdge } from './AutomationEdge';
import { AutomationNode } from './AutomationNode/AutomationNode';
import { AppNode } from './types';
import './AutomationBoard.css';


const nodeTypes = {
  automation: AutomationNode,
};

const edgeTypes = {
  automation: AutomationEdge,
};

const defaultEdgeOptions = {
  type: 'automation',
  animated: true,
};

export interface AutomationBoardProps {
  initialNodes?: AppNode[];
  initialEdges?: Edge[];
}

const AutomationBoardInternal: React.FC<AutomationBoardProps> = ({
  initialNodes = [],
  initialEdges = [],
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(getLayoutedElements(initialNodes, initialEdges));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  // Re-layout if initial data changes significantly
  useEffect(() => {
    setNodes(getLayoutedElements(initialNodes, initialEdges));
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Automatically fit view when nodes change (e.g. after layout)
  useEffect(() => {
    if (nodes.length > 0) {
      window.requestAnimationFrame(() => {
        fitView({ duration: 400, padding: 0.15 });
      });
    }
  }, [nodes.length, fitView]);

  // Handle structural changes (deletions/healing) by recalculating layout
  const lastStructureRef = useRef({ nodeCount: nodes.length, edgeCount: edges.length });
  
  useEffect(() => {
    if (nodes.length !== lastStructureRef.current.nodeCount || edges.length !== lastStructureRef.current.edgeCount) {
      lastStructureRef.current = { nodeCount: nodes.length, edgeCount: edges.length };
      setNodes((nds) => getLayoutedElements(nds as AppNode[], edges));
    }
  }, [nodes.length, edges.length, setNodes, edges]);

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

  return (
    <div ref={containerRef} className="automation-board-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        nodesDraggable={false}
        minZoom={0.2}
        maxZoom={1.5}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          className="automation-board-background"
          gap={16}
          size={1}
        />
      </ReactFlow>
    </div>
  );
};

export const AutomationBoard: React.FC<AutomationBoardProps> = (props) => (
  <ReactFlowProvider>
    <AutomationBoardInternal {...props} />
  </ReactFlowProvider>
);

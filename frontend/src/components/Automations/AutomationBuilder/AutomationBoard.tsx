import React from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AutomationEdge } from './AutomationEdge';
import { AutomationNode } from './AutomationNode/AutomationNode';
import { useAutomationBoard, UseAutomationBoardProps } from './useAutomationBoard';
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

export interface AutomationBoardProps extends UseAutomationBoardProps {}

const AutomationBoardInternal: React.FC<AutomationBoardProps> = (props) => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
    containerRef,
  } = useAutomationBoard(props);

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

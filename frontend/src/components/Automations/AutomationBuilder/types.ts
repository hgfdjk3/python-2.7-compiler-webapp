import type { Node, Edge } from '@xyflow/react';

export interface AutomationNodeData extends Record<string, unknown> {
  title: string;
  description: string;
  tools?: string[];
  isRewriting?: boolean;
}

export interface AutomationEdgeData extends Record<string, unknown> {
  popoverOpened?: boolean;
}

export type AppNode = Node<AutomationNodeData, 'automation'>;
export type AppEdge = Edge<AutomationEdgeData, 'automation'>;

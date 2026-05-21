import { Node, Edge } from '@xyflow/react';
import { AppNode } from '../types';

export const getLayoutedElements = (nodes: AppNode[], edges: Edge[]) => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = new Map<string, string[]>();
  const incomingCount = new Map<string, number>();

  nodes.forEach(n => incomingCount.set(n.id, 0));

  edges.forEach(e => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
    incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
  });

  const levels = new Map<string, number>();
  const visited = new Set<string>();

  const computeLevels = (nodeId: string, level: number) => {
    const currentLevel = levels.get(nodeId) || 0;
    levels.set(nodeId, Math.max(currentLevel, level));
    
    // To prevent infinite loops in cyclic graphs (though automations should be DAGs)
    if (visited.has(nodeId + level)) return;
    visited.add(nodeId + level);

    adj.get(nodeId)?.forEach(childId => {
      computeLevels(childId, level + 1);
    });
  };

  // Find roots (nodes with no incoming edges)
  const roots = nodes.filter(n => incomingCount.get(n.id) === 0);

  if (roots.length === 0 && nodes.length > 0) {
    // If it's a cycle, pick the first node as root
    computeLevels(nodes[0].id, 0);
  } else {
    roots.forEach(root => computeLevels(root.id, 0));
  }

  // Handle unreachable nodes
  nodes.forEach(n => {
    if (!levels.has(n.id)) computeLevels(n.id, 0);
  });

  const levelGroups = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(nodeId);
  });

  const HORIZONTAL_SPACING = 520;
  const VERTICAL_SPACING = 240;

  return nodes.map(node => {
    const level = levels.get(node.id) || 0;
    const group = levelGroups.get(level)!;
    const indexInLevel = group.indexOf(node.id);
    const levelSize = group.length;
    
    return {
      ...node,
      position: {
        x: level * HORIZONTAL_SPACING + 50,
        y: (indexInLevel - (levelSize - 1) / 2) * VERTICAL_SPACING + 150
      }
    };
  });
};

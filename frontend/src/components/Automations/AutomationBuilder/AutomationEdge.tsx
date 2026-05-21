import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';
import { ActionIcon, Paper, Tooltip, Popover, Button, Stack, Text, Group } from '@mantine/core';
import { IconX, IconTrash, IconBinaryTree, IconPlus } from '@tabler/icons-react';
import { AppEdge, AppNode } from './types';
import './AutomationEdge.css';

export const AutomationEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  target,
  source,
  data,
}: EdgeProps<AppEdge>) => {
  const { setNodes, setEdges, getEdges } = useReactFlow<AppNode, AppEdge>();

  const setPopoverOpened = (val: boolean | ((prev: boolean) => boolean)) => {
    setEdges((eds) => eds.map((e) => {
      if (e.id === id) {
        const currentVal = !!e.data?.popoverOpened;
        const nextVal = typeof val === 'function' ? val(currentVal) : val;
        return { ...e, data: { ...e.data, popoverOpened: nextVal } };
      }
      return e;
    }));
  };

  const popoverOpened = !!data?.popoverOpened;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getDownstreamIds = (nodeId: string, allEdges: any[]) => {
    const ids = new Set<string>([nodeId]);
    const queue = [nodeId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      allEdges.forEach((e) => {
        if (e.source === currentId && !ids.has(e.target)) {
          ids.add(e.target);
          queue.push(e.target);
        }
      });
    }
    return ids;
  };

  const deleteNextNode = () => {
    const allEdges = getEdges();
    
    // Find predecessors and successors to "heal" the chain
    const predecessors = Array.from(new Set(allEdges.filter((e) => e.target === target).map((e) => e.source)));
    const successors = Array.from(new Set(allEdges.filter((e) => e.source === target).map((e) => e.target)));

    setNodes((nds) => nds.filter((node) => node.id !== target));
    
    setEdges((eds) => {
      // Remove edges connected to the target node
      const filteredEds = eds.filter((edge) => 
        edge.source !== target && 
        edge.target !== target && 
        edge.id !== id
      );

      // Create healing connections
      const healingEdges: AppEdge[] = [];
      predecessors.forEach((predId) => {
        successors.forEach((succId) => {
          healingEdges.push({
            id: `heal-${predId}-${succId}-${Math.random().toString(36).substr(2, 9)}`,
            source: predId,
            target: succId,
            type: 'automation',
            animated: true,
          });
        });
      });

      return [...filteredEds, ...healingEdges];
    });

    setPopoverOpened(false);
  };

  const deleteAllNextNodes = () => {
    const allEdges = getEdges();
    const downstreamIds = getDownstreamIds(target, allEdges);
    setNodes((nds) => nds.filter((node) => !downstreamIds.has(node.id)));
    setEdges((eds) => eds.filter((edge) => !downstreamIds.has(edge.source) && !downstreamIds.has(edge.target) && edge.id !== id));
    setPopoverOpened(false);
  };
  const addNodeInBetween = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    const newNodeId = `node-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: AppNode = {
      id: newNodeId,
      type: 'automation',
      position: { x: 0, y: 0 },
      data: {
        title: 'New Step',
        description: 'Describe this automated step...',
        tools: [],
      },
    };

    setNodes((nds) => [...nds, newNode]);

    setEdges((eds) => {
      const filteredEds = eds.filter((e) => e.id !== id);
      const edge1: AppEdge = {
        id: `edge-${source}-${newNodeId}`,
        source: source,
        target: newNodeId,
        type: 'automation',
        animated: true,
      };
      const edge2: AppEdge = {
        id: `edge-${newNodeId}-${target}`,
        source: newNodeId,
        target: target,
        type: 'automation',
        animated: true,
      };
      return [...filteredEds, edge1, edge2];
    });
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 2 }} className="automation-edge-path" />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="automation-edge-label"
        >
          <Group gap={4} wrap="nowrap" className="edge-actions-group">
            <ActionIcon
              color="blue"
              size="sm"
              radius="xs"
              variant="subtle"
              onClick={addNodeInBetween}
              className="edge-plus-button"
            >
              <IconPlus size={12} />
            </ActionIcon>

            <Popover
              opened={popoverOpened}
              onChange={setPopoverOpened}
              position="top"
              withArrow
              shadow="md"
              withinPortal
            >
              <Popover.Target>
                <ActionIcon
                  color="red"
                  size="sm"
                  radius="xs"
                  variant="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopoverOpened((o) => !o);
                  }}
                  className={`edge-delete-button ${popoverOpened ? 'is-active' : ''}`}
                >
                  <IconX size={12} />
                </ActionIcon>
              </Popover.Target>

              <Popover.Dropdown p="xs" className="automation-edge-dropdown">
                <Stack gap="xs">
                  <Text size="xs" className="automation-edge-header">Remove:</Text>
                  <Group gap="xs" wrap="nowrap">
                    <Button
                      variant="light"
                      color="red"
                      size="compact-sm"
                      leftSection={<IconTrash size={14} />}
                      onClick={deleteNextNode}
                      radius="md"
                    >
                      Step
                    </Button>
                    <Button
                      variant="filled"
                      color="red"
                      size="compact-sm"
                      leftSection={<IconBinaryTree size={14} />}
                      onClick={deleteAllNextNodes}
                      radius="md"
                    >
                      Branch
                    </Button>
                  </Group>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </Group>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

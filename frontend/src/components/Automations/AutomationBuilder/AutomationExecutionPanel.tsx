import React, { useEffect, useState } from 'react';
import { Box, Text, ScrollArea, Stack, Paper, Accordion } from '@mantine/core';
import { MarkdownResponse } from '../../Project/Chat/MarkdownResponse';
import { AppNode } from './types';
import { NodeExecutionState } from '@/api/automations';
import { ExecutionNodeCard } from './ExecutionNodeCard';

export interface AutomationExecutionPanelProps {
  opened: boolean;
  onClose: () => void;
  nodes: AppNode[];
  nodeExecutionStates: Record<string, NodeExecutionState>;
  activePanel: string | null;
  onActivePanelChange: (id: string | null) => void;
}

export const AutomationExecutionPanel: React.FC<AutomationExecutionPanelProps> = ({ opened, onClose, nodes, nodeExecutionStates, activePanel, onActivePanelChange }) => {
  const executedNodeIds = Object.keys(nodeExecutionStates).filter(id => id !== 'global');

  // Automatically open the latest executed node when a new one appears
  useEffect(() => {
    if (executedNodeIds.length > 0) {
      onActivePanelChange(executedNodeIds[executedNodeIds.length - 1]);
    }
  }, [executedNodeIds.length]);

  return (
    <Box
      style={{
        width: opened ? 340 : 0,
        opacity: opened ? 1 : 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        overflow: 'hidden',
        borderRight: opened ? '1px solid var(--mantine-color-default-border)' : 'none',
        flexShrink: 0,
      }}
      h="100%"
      bg="var(--mantine-color-body)"
    >
      <Box w={340} h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
        <Box p="xs" style={{ height: 50, borderBottom: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}>
          {/* <Group justify="space-between"> */}
          {/* <Group gap="xs">
              <ThemeIcon variant="light" color="zinc" size="sm" radius="md">
                <IconTerminal2 size={14} />
              </ThemeIcon>
              <Title order={6} fw={600} style={{ letterSpacing: '-0.01em' }}>Execution Logs</Title>
            </Group>
            <CloseButton onClick={onClose} size="sm" variant="subtle" radius="md" />
          </Group> */}
        </Box>

        <ScrollArea style={{ flex: 1 }} scrollbarSize={3} offsetScrollbars>
        <Stack gap="xs" p="0" pb="md">
          {nodeExecutionStates['global'] && (
            <Paper p="xs" withBorder radius="md" style={{ borderColor: 'var(--mantine-color-red-6)' }} bg="red.0">
              <Text c="red.6" fw={600} size="xs" mb="xs">Global Error</Text>
              <MarkdownResponse content={nodeExecutionStates['global'].content} />
            </Paper>
          )}

          {executedNodeIds.length === 0 && !nodeExecutionStates['global'] && (
            <Text c="dimmed" fs="italic" ta="center" mt="md" size="xs">Waiting for execution data...</Text>
          )}

          {executedNodeIds.length > 0 && (
            <Accordion
              variant="default"
              value={activePanel}
              onChange={onActivePanelChange}
              styles={{
                item: {
                  border: 'none',
                  borderBottom: '1px solid var(--mantine-color-default-border)',
                },
                control: { padding: 'var(--mantine-spacing-xs) 0' },
                content: { padding: '0 0 var(--mantine-spacing-xs) 0' }
              }}
            >
              {executedNodeIds.map(nodeId => {
                const state = nodeExecutionStates[nodeId];
                const nodeTitle = nodes.find(n => n.id === nodeId)?.data.title || `Stage ${nodeId}`;

                return (
                  <ExecutionNodeCard
                    key={nodeId}
                    nodeId={nodeId}
                    nodeTitle={nodeTitle}
                    state={state}
                  />
                );
              })}
            </Accordion>
          )}
        </Stack>
        </ScrollArea>
      </Box>
    </Box>
  );
};

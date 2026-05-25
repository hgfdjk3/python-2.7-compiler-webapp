import React from 'react';
import { Title, Accordion, Stack, Box, Text, ScrollArea, Drawer, Paper } from '@mantine/core';
import { IconCheck, IconX, IconTool, IconBrain } from '@tabler/icons-react';
import { MarkdownResponse } from '../../Project/Chat/MarkdownResponse';
import { NodeExecutionState } from '../../../../../api/automations';
import { AppNode } from './types';

export interface AutomationExecutionPanelProps {
  opened: boolean;
  onClose: () => void;
  nodes: AppNode[];
  nodeExecutionStates: Record<string, NodeExecutionState>;
}

export const AutomationExecutionPanel: React.FC<AutomationExecutionPanelProps> = ({ opened, onClose, nodes, nodeExecutionStates }) => {
  // Get active or completed nodes
  const executedNodeIds = Object.keys(nodeExecutionStates).filter(id => id !== 'global');

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={<Title order={4}>Workflow Logs</Title>}
      withOverlay={false}
      shadow="md"
      styles={{
        inner: { position: 'absolute' }, 
        content: { position: 'absolute' }
      }}
    >
      <ScrollArea h="calc(100vh - 60px)" offsetScrollbars>
        <Stack gap="md" pb="xl">
          {nodeExecutionStates['global'] && (
            <Paper p="sm" withBorder style={{ borderColor: 'var(--mantine-color-red-6)' }}>
              <Text c="red.6" fw={600}>Global Error</Text>
              <MarkdownResponse content={nodeExecutionStates['global'].content} />
            </Paper>
          )}

          {executedNodeIds.length === 0 && !nodeExecutionStates['global'] && (
            <Text c="dimmed" fs="italic" ta="center" mt="xl">No execution data yet...</Text>
          )}

          {executedNodeIds.length > 0 && (
            <Accordion variant="separated" multiple defaultValue={executedNodeIds}>
              {executedNodeIds.map(nodeId => {
                const state = nodeExecutionStates[nodeId];
                const nodeTitle = nodes.find(n => n.id === nodeId)?.data.title || `Stage ${nodeId}`;
                
                let icon = <IconBrain size={18} color="var(--mantine-color-blue-6)" />;
                if (state.status === 'completed') icon = <IconCheck size={18} color="var(--mantine-color-teal-6)" />;
                if (state.status === 'error') icon = <IconX size={18} color="var(--mantine-color-red-6)" />;

                return (
                  <Accordion.Item key={nodeId} value={nodeId}>
                    <Accordion.Control icon={icon}>
                      <Text fw={600}>{nodeTitle}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="sm">
                        {state.tools && state.tools.length > 0 && (
                          <Box>
                            <Text size="sm" fw={600} mb={4}>Tools Used</Text>
                            <Accordion variant="contained" radius="sm">
                              {state.tools.map((tool, idx) => (
                                <Accordion.Item key={idx} value={tool.name + idx}>
                                  <Accordion.Control icon={<IconTool size={14} color="var(--mantine-color-gray-6)" />}>
                                    <Text size="xs" fw={500} c="dimmed">{tool.name}</Text>
                                  </Accordion.Control>
                                  <Accordion.Panel>
                                    <Box bg="var(--mantine-color-gray-1)" p={4} style={{ borderRadius: 4 }}>
                                      {tool.input && (
                                        <Text size="xs" ff="monospace" style={{ whiteSpace: 'pre-wrap' }}>
                                          {JSON.stringify(tool.input, null, 2)}
                                        </Text>
                                      )}
                                      {tool.output && (
                                        <Text size="xs" ff="monospace" mt={4} style={{ whiteSpace: 'pre-wrap', borderTop: '1px solid var(--mantine-color-gray-3)', paddingTop: 4 }}>
                                          {typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2)}
                                        </Text>
                                      )}
                                    </Box>
                                  </Accordion.Panel>
                                </Accordion.Item>
                              ))}
                            </Accordion>
                          </Box>
                        )}

                        {state.content && (
                          <Box>
                            <Text size="sm" fw={600} mb={4}>Thinking Process</Text>
                            <Paper p="xs" withBorder bg="var(--mantine-color-gray-0)">
                              <MarkdownResponse content={state.content} />
                            </Paper>
                          </Box>
                        )}
                        
                        {!state.content && state.status === 'running' && (
                           <Text size="sm" c="dimmed" fs="italic">Executing...</Text>
                        )}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          )}
        </Stack>
      </ScrollArea>
    </Drawer>
  );
};

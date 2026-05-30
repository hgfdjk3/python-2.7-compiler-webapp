import React from 'react';
import { Title, Accordion, Stack, Box, Text, ScrollArea, Group, CloseButton, ThemeIcon, Divider, Paper } from '@mantine/core';
import { IconCheck, IconX, IconTool, IconBrain, IconTerminal2 } from '@tabler/icons-react';
import { MarkdownResponse } from '../../Project/Chat/MarkdownResponse';
import { AppNode } from './types';
import { NodeExecutionState } from '@/api/automations';

export interface AutomationExecutionPanelProps {
  opened: boolean;
  onClose: () => void;
  nodes: AppNode[];
  nodeExecutionStates: Record<string, NodeExecutionState>;
}

export const AutomationExecutionPanel: React.FC<AutomationExecutionPanelProps> = ({ opened, onClose, nodes, nodeExecutionStates }) => {
  if (!opened) return null;

  const executedNodeIds = Object.keys(nodeExecutionStates).filter(id => id !== 'global');

  return (
    <Box
      pos="absolute"
      top={0}
      left={0}
      w={340}
      h="100%"
      bg="var(--mantine-color-body)"
    >
      <Box p="xs" h="50" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
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

      <ScrollArea.Autosize mah="100%" scrollbarSize={3} offsetScrollbars>
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
              multiple
              defaultValue={executedNodeIds}
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

                let icon = <IconBrain size={14} color="var(--mantine-color-blue-6)" />;
                if (state.status === 'completed') icon = <IconCheck size={14} color="var(--mantine-color-success-6)" />;
                if (state.status === 'error') icon = <IconX size={14} color="var(--mantine-color-error-6)" />;

                return (
                  <Accordion.Item key={nodeId} value={nodeId}>
                    <Accordion.Control icon={icon}>
                      <Text fw={500} size="xs">{nodeTitle}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="xs" mt="xs">
                        {state.tools && state.tools.length > 0 && (
                          <Box>
                            <Text size="10px" fw={600} c="dimmed" tt="uppercase" mb={2} style={{ letterSpacing: '0.05em' }}>Tools Used</Text>
                            <Accordion variant="default" styles={{
                              item: { borderBottom: '1px solid var(--mantine-color-default-border)' },
                              control: { padding: '4px 0' },
                              content: { padding: '0 0 8px 0' }
                            }}>
                              {state.tools.map((tool, idx) => (
                                <Accordion.Item key={idx} value={tool.name + idx} style={{ borderBottom: idx === state.tools.length - 1 ? 'none' : undefined }}>
                                  <Accordion.Control icon={<IconTool size={12} color="var(--mantine-color-zinc-5)" />}>
                                    <Text size="10px" fw={500} c="zinc.7">{tool.name}</Text>
                                  </Accordion.Control>
                                  <Accordion.Panel>
                                    <Box pl="sm" style={{ borderLeft: '2px solid var(--mantine-color-zinc-2)' }}>
                                      {tool.input && (
                                        <Box mb={tool.output ? 'xs' : 0}>
                                          <Text size="9px" fw={600} c="dimmed" tt="uppercase" mb={2}>Input</Text>
                                          <Text size="10px" ff="monospace" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {JSON.stringify(tool.input, null, 2)}
                                          </Text>
                                        </Box>
                                      )}
                                      {tool.output && (
                                        <Box style={{ paddingTop: tool.input ? 4 : 0 }}>
                                          {tool.input && <Divider mb="xs" variant="dashed" />}
                                          <Text size="9px" fw={600} c="dimmed" tt="uppercase" mb={2}>Output</Text>
                                          <Text size="10px" ff="monospace" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2)}
                                          </Text>
                                        </Box>
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
                            <Text size="10px" fw={600} c="dimmed" tt="uppercase" mb={4} style={{ letterSpacing: '0.05em' }}>Thinking Process</Text>
                            <Box pl="sm" style={{ borderLeft: '2px solid var(--mantine-color-zinc-2)' }}>
                              <Text size="xs">
                                <MarkdownResponse content={state.content} />
                              </Text>
                            </Box>
                          </Box>
                        )}

                        {!state.content && state.status === 'running' && (
                          <Text size="10px" c="blue.6" fs="italic" style={{ animation: 'pulse 2s infinite' }}>Executing...</Text>
                        )}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          )}
        </Stack>
      </ScrollArea.Autosize>
    </Box>
  );
};


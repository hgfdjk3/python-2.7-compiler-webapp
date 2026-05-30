import React from 'react';
import { Accordion, Stack, Box, Text } from '@mantine/core';
import { IconCheck, IconX, IconBrain } from '@tabler/icons-react';
import { MarkdownResponse } from '../../Project/Chat/MarkdownResponse';
import { NodeExecutionState } from '@/api/automations';
import { ToolExecutionCard } from './ToolExecutionCard';

export interface ExecutionNodeCardProps {
  nodeId: string;
  nodeTitle: string;
  state: NodeExecutionState;
}

export const ExecutionNodeCard: React.FC<ExecutionNodeCardProps> = ({ nodeId, nodeTitle, state }) => {
  let icon = <IconBrain size={14} color="var(--mantine-color-blue-6)" />;
  if (state.status === 'completed') icon = <IconCheck size={14} color="var(--mantine-color-success-6)" />;
  if (state.status === 'error') icon = <IconX size={14} color="var(--mantine-color-error-6)" />;

  return (
    <Accordion.Item value={nodeId}>
      <Accordion.Control icon={icon} px="xs">
        <Text fw={500} size="xs">{nodeTitle}</Text>
      </Accordion.Control>
      <Accordion.Panel >
        <Stack gap="xs" mt="xs">
          {state.tools && state.tools.length > 0 && (
            <Box w="100%">
              <Text size="10px" fw={600} c="dimmed" tt="uppercase" mb={2} style={{ letterSpacing: '0.05em' }}>Tools Used</Text>
              <Accordion variant="default" styles={{
                item: { borderBottom: '1px solid var(--mantine-color-default-border)' },
                control: { padding: '4px 0' },
                content: { padding: '0 0 8px 0' }
              }}>
                {state.tools.map((tool, idx) => (
                  <ToolExecutionCard
                    key={idx}
                    tool={tool}
                    isLast={idx === state.tools.length - 1}
                    value={tool.name + idx}
                  />
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
};

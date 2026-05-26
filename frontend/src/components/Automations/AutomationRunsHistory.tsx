import React from 'react';
import { Box, Title, Text, Stack, Group, ScrollArea, ActionIcon, Flex, Tooltip, Divider } from '@mantine/core';
import { IconRefresh, IconPlayerPlay, IconCheck, IconX, IconChevronRight } from '@tabler/icons-react';

interface RunRecord {
  id: string;
  status: 'success' | 'error' | 'running';
  timestamp: string;
  duration: string;
}

const mockRuns: RunRecord[] = [
  { id: '1', status: 'error', timestamp: 'May 21, 18:26:06', duration: '33ms' },
  { id: '2', status: 'error', timestamp: 'May 21, 18:25:44', duration: '82ms' },
  { id: '3', status: 'success', timestamp: 'May 21, 18:20:00', duration: '120ms' },
  { id: '4', status: 'success', timestamp: 'May 21, 17:15:22', duration: '150ms' },
  { id: '5', status: 'success', timestamp: 'May 20, 10:05:11', duration: '110ms' },
  { id: '6', status: 'success', timestamp: 'May 19, 09:00:00', duration: '105ms' },
  { id: '7', status: 'error', timestamp: 'May 18, 14:30:00', duration: '45ms' },
  { id: '8', status: 'success', timestamp: 'May 18, 12:00:00', duration: '115ms' },
  { id: '9', status: 'running', timestamp: 'May 18, 11:55:00', duration: '...' },
];

export const AutomationRunsHistory: React.FC = () => {
  return (
    <Box w={280} h="100%" style={{ borderRight: '1px solid var(--mantine-color-default-border)' }} pr="md">
      <Stack h="100%" gap="xs">
        <Group justify="space-between" mb="xs">
          <Title order={5} fw={600}>Executions</Title>
          <Tooltip label="Refresh">
            <ActionIcon variant="subtle" color="gray" size="sm">
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <IconCheck size={16} color="var(--mantine-color-green-6)" />
            <Text size="xs" c="dimmed">Auto refresh</Text>
          </Group>
          <ActionIcon variant="default" size="sm">
            <IconPlayerPlay size={14} />
          </ActionIcon>
        </Group>

        <Divider my="xs" />

        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Stack gap={0} pb="md">
            {mockRuns.map((run, index) => (
              <React.Fragment key={run.id}>
                <Box 
                  py="sm" 
                  px="xs"
                  style={{ 
                    cursor: 'pointer',
                    borderRadius: 'var(--mantine-radius-md)',
                    backgroundColor: index === 0 ? 'var(--mantine-color-default-hover)' : 'transparent',
                    transition: 'background-color 150ms ease',
                  }}
                  className="execution-item"
                >
                  <Flex justify="space-between" align="center">
                    <Stack gap={2}>
                      <Group gap="xs">
                        {run.status === 'error' ? (
                          <Box w={6} h={6} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-red-6)' }} />
                        ) : run.status === 'success' ? (
                          <Box w={6} h={6} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-green-6)' }} />
                        ) : (
                          <Box w={6} h={6} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-blue-6)' }} />
                        )}
                        <Text size="sm" fw={index === 0 ? 600 : 400}>
                          {run.timestamp}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" pl="18px">
                        {run.status === 'error' ? 'Failed' : run.status === 'success' ? 'Success' : 'Running'} 
                        {run.duration && ` • ${run.duration}`}
                      </Text>
                    </Stack>
                    <IconChevronRight size={14} style={{ color: 'var(--mantine-color-gray-4)' }} />
                  </Flex>
                </Box>
                {index < mockRuns.length - 1 && <Divider my={4} color="var(--mantine-color-default-border)" style={{ opacity: 0.4 }} />}
              </React.Fragment>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>
    </Box>
  );
};


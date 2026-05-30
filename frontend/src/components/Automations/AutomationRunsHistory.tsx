import React, { useState, useMemo } from 'react';
import { Box, Title, Text, Stack, Group, ScrollArea, ActionIcon, Flex, Tooltip, Divider, Loader, Center } from '@mantine/core';
import { IconRefresh, IconCheck, IconX, IconChevronRight } from '@tabler/icons-react';
import { useAutomationRuns } from '../../api/automations';
import { AutomationRunsFilter } from './AutomationRunsFilter';

export interface AutomationRunsHistoryProps {
  automationId?: string;
  onSelectRun?: (run: any) => void;
  selectedRunId?: string;
}

export const AutomationRunsHistory: React.FC<AutomationRunsHistoryProps> = ({
  automationId,
  onSelectRun,
  selectedRunId
}) => {
  const { data: runs, isLoading, refetch } = useAutomationRuns(automationId || '');

  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredAndSortedRuns = useMemo(() => {
    if (!runs) return [];
    let result = [...runs];

    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((run: any) => run.status === statusFilter);
    }

    result.sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [runs, statusFilter, sortOrder]);

  return (
    <Box w={280} h="100%" style={{ borderRight: '1px solid var(--mantine-color-default-border)' }} px="0">
      <Divider />
      <Stack h="100%" gap="5" pt="xs">
        <Group justify="space-between" mb="xs" px="xs">
          <Title order={5} fw={600}>Executions</Title>
          <Tooltip label="Refresh">
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => refetch()}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Box px="xs">

          <AutomationRunsFilter
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            sortOrder={sortOrder}
            onSortToggle={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          />
        </Box>

        <ScrollArea style={{ flex: 1, padding: 0 }} scrollbarSize={3} p={0} >
          {
            isLoading ? (
              <Center py="xl" >
                <Loader size="sm" />
              </Center>
            ) : !filteredAndSortedRuns || filteredAndSortedRuns.length === 0 ? (
              <Text c="dimmed" size="xs" ta="center" mt="xl">No runs found.</Text>
            ) : (
              <Stack gap={0} pb="md">
                {filteredAndSortedRuns.map((run, index) => {
                  const date = new Date(run.timestamp);
                  const isSelected = selectedRunId === run.id || (index === 0 && !selectedRunId);
                  return (
                    <React.Fragment key={run.id}>
                      <Divider />
                      <Box
                        py="sm"
                        px="xs"
                        onClick={() => onSelectRun?.(run)}
                        style={{
                          cursor: 'pointer',
                          borderLeft: '3px solid ',
                          borderLeftColor: isSelected ? 'var(--mantine-color-gray-4)' : 'transparent',
                          backgroundColor: isSelected ? 'var(--mantine-color-default-hover)' : 'transparent',
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
                              <Text size="sm" fw={isSelected ? 600 : 400}>
                                {date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed" pl="18px">
                              {run.status === 'error' ? 'Failed' : run.status === 'success' ? 'Success' : 'Running'}
                              {run.duration && ` • ${run.duration}`}
                            </Text>
                          </Stack>
                          <IconChevronRight size={14} style={{ color: 'var(--mantine-color-gray-4)' }} />
                        </Flex>
                        {/* {index < filteredAndSortedRuns.length - 1 && <Divider my={4} color="var(--mantine-color-default-border)" />} */}
                      </Box>
                    </React.Fragment>
                  );
                })}
              </Stack>
            )}
        </ScrollArea>
      </Stack>
    </Box >
  );
};


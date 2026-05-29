import React, { useState } from 'react';
import { Box, Title, Text, Stack, Center, Flex, SegmentedControl, Group, Loader } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { AutomationBuilder } from '../components/Automations/AutomationBuilder/AutomationBuilder';
import { useAutomation } from '../api/automations';
import { AutomationRunsHistory } from '../components/Automations/AutomationRunsHistory';

export const AutomationsPage: React.FC = () => {
  const { automationId } = useParams<{ automationId: string }>();
  const { data: automation, isLoading } = useAutomation(automationId || '');
  const [activeTab, setActiveTab] = useState('Editor');

  const isEditing = !!automationId;

  if (isEditing && isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }

  return (
    <Flex w="100%" h="100%" p="md" gap="md" style={{ overflow: 'hidden' }}>
      {/* Left Sidebar: Runs History */}
      <AutomationRunsHistory />

      {/* Right Main Area: Automation Builder & Header */}
      <Box flex={1} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <Stack gap="xs" mb="sm">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Title order={2} fw={800} style={{ letterSpacing: '-0.5px' }}>
                {isEditing ? 'Edit Automation' : 'Automation Builder'}
              </Title>
              <Text c="dimmed" size="sm">
                {isEditing
                  ? `Editing "${automation?.name || 'Automation'}". Modify nodes and connections, then save.`
                  : 'Design and orchestrate your AI workflows by connecting triggers to tools.'}
              </Text>
            </Box>
            <SegmentedControl 
              data={['Editor', 'Executions', 'Evaluations']} 
              value={activeTab}
              onChange={setActiveTab}
              size="sm"
            />
          </Group>
        </Stack>

        <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {isEditing && automation ? (
            <AutomationBuilder
              key={automation.id}
              automationId={automation.id}
              initialName={automation.name}
              initialNodes={automation.nodes}
              initialEdges={automation.edges}
              height="100%"
            />
          ) : (
            <AutomationBuilder height="100%" />
          )}
        </Box>
      </Box>
    </Flex>
  );
};

import React from 'react';
import { Box, Title, Text, Stack, Container, Loader, Center } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { AutomationBuilder } from '../components/Automations/AutomationBuilder/AutomationBuilder';
import { useAutomation } from '../api/automations';

export const AutomationsPage: React.FC = () => {
  const { automationId } = useParams<{ automationId: string }>();
  const { data: automation, isLoading } = useAutomation(automationId || '');

  const isEditing = !!automationId;

  if (isEditing && isLoading) {
    return (
      <ProjectLayout>
        <Center h="100%">
          <Loader />
        </Center>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <Container w="100%" h="100%" py="md" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Stack gap="xs" mb="lg">
          <Title order={2} fw={800} style={{ letterSpacing: '-0.5px' }}>
            {isEditing ? 'Edit Automation' : 'Automation Builder'}
          </Title>
          <Text c="dimmed" size="sm">
            {isEditing
              ? `Editing "${automation?.name || 'Automation'}". Modify nodes and connections, then save.`
              : 'Design and orchestrate your AI workflows by connecting triggers to tools.'}
          </Text>
        </Stack>

        <Box style={{ flex: 1, minHeight: 0 }}>
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
      </Container>
    </ProjectLayout>
  );
};

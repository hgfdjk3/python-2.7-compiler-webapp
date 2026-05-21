import React from 'react';
import { Box, Title, Text, Stack, Container } from '@mantine/core';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { AutomationBuilder } from '../components/Automations/AutomationBuilder/AutomationBuilder';

export const AutomationsPage: React.FC = () => {
  return (
    <ProjectLayout>
      <Container w="100%" h="100%" py="md" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Stack gap="xs" mb="lg">
          <Title order={2} fw={800} style={{ letterSpacing: '-0.5px' }}>
            Automation Builder
          </Title>
          <Text c="dimmed" size="sm">
            Design and orchestrate your AI workflows by connecting triggers to tools.
          </Text>
        </Stack>

        <Box style={{ flex: 1, minHeight: 0 }}>
          <AutomationBuilder height="100%" />
        </Box>
      </Container>
    </ProjectLayout>
  );
};

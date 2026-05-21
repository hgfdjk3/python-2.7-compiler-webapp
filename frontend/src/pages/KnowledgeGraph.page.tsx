import React from 'react';
import { Box, Card, Group, Stack, Text, Title } from '@mantine/core';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { KnowledgeGraphPreview } from '../components/Project/KnowledgeGraph/KnowledgeGraphPreview';

export const KnowledgeGraphPage: React.FC = () => {
  return (
    <ProjectLayout>
      <Box p="md" style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
          <Group justify="space-between" align="end">
            <Box>
              <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                Project
              </Text>
              <Title order={2}>Knowledge Graph</Title>
            </Box>
            <Text size="sm" c="dimmed">
              A navigable map of project concepts, docs, and relationships.
            </Text>
          </Group>

          <Card withBorder radius="lg" p="lg" style={{ flex: 1, minHeight: 0 }}>
            <KnowledgeGraphPreview />
          </Card>
        </Stack>
      </Box>
    </ProjectLayout>
  );
};

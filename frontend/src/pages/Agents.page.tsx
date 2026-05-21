import { ScrollArea, Title, Text, Stack, Container, Box } from '@mantine/core';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { AgentMarketplace } from '../components/Agents/AgentMarketplace';

export const AgentsPage: React.FC = () => {
  return (
    <ProjectLayout>
      <Container w="100%" h="100%" py="md" style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: '1200px' }}>
        <Stack gap="xs" mb="xl">
          <Title
            order={1}
            fw={800}
            style={{
              letterSpacing: '-1px',
            }}
          >
            Connectors Library
          </Title>
          <Text c="zinc.4" size="md">
            Discover and manage agents to bring external sources into your workspace.
          </Text>
        </Stack>

        <ScrollArea h="100%" offsetScrollbars scrollbarSize={6} pr="sm">
          <Box pb="xl">
            <AgentMarketplace />
          </Box>
        </ScrollArea>
      </Container>
    </ProjectLayout>
  );
};

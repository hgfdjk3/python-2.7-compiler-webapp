import React from 'react';
import { Box, Container, Stack, Title, Text, Button, Group } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import './HomeOverview.css';

export interface HomeOverviewProps {
  userName?: string;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({ userName = 'Ran' }) => {
  const navigate = useNavigate();

  return (
    <Box className="home-overview" style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Container size="sm" py="5xl">
        <Stack gap="xl" align="center" style={{ textAlign: 'center' }}>
          <Stack gap="2xs">
            <Title order={1} fw={800} style={{ fontSize: 'var(--mantine-font-size-3xl)', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              Welcome to Atom, {userName}
            </Title>
            <Text c="dimmed" size="md" maw={480} mx="auto">
              Your intelligent research and automation workspace. Connect external data sources, orchestrate automations, and organize your knowledge.
            </Text>
          </Stack>

          <Group gap="sm" justify="center" mt="xs">
            <Button
              onClick={() => navigate('/new_project')}
              size="md"
              variant="filled"
              color="zinc"
              leftSection={<IconPlus size={16} stroke={2} />}
              style={{ borderRadius: 'var(--mantine-radius-md)' }}
            >
              New Workspace
            </Button>
            <Button
              onClick={() => navigate('/projects')}
              size="md"
              variant="subtle"
              color="gray"
              style={{ borderRadius: 'var(--mantine-radius-md)' }}
            >
              Explore Workspaces
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
};

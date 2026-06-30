import React from 'react';
import { Box, Title, Text, Stack, Button, Group, useMantineColorScheme } from '@mantine/core';
import { IconFolders, IconPlug, IconBolt, IconSun, IconMoon } from '@tabler/icons-react';
import './OnboardingWelcomeStep.css';

export const OnboardingWelcomeStep: React.FC = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const toggleColorScheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <Stack gap="lg">
      <Box>
        <Title className="onboarding-welcome-title">
          Welcome to Atom
        </Title>
        <Text c="zinc.4" size="sm" style={{ lineHeight: 1.5 }}>
          Your intelligent research and automation workspace. Connect external sources, orchestrate automations, and organize your knowledge.
        </Text>
      </Box>

      <Stack gap="xs">
        {/* Feature 1 */}
        <div className="onboarding-feature-item">
          <div className="onboarding-feature-icon">
            <IconFolders size={22} stroke={1.5} />
          </div>
          <Stack gap="3xs" style={{ flex: 1 }}>
            <Text fw={600} size="sm" c="zinc.4">
              Organized Workspaces
            </Text>
            <Text size="xs" c="zinc.4" style={{ lineHeight: 1.4 }}>
              Separate your research topics into dedicated projects with unique knowledge bases and chats.
            </Text>
          </Stack>
        </div>

        {/* Feature 2 */}
        <div className="onboarding-feature-item">
          <div className="onboarding-feature-icon">
            <IconPlug size={22} stroke={1.5} />
          </div>
          <Stack gap="3xs" style={{ flex: 1 }}>
            <Text fw={600} size="sm" c="zinc.4">
              Connected Services
            </Text>
            <Text size="xs" c="zinc.4" style={{ lineHeight: 1.4 }}>
              Enable connectors to interface with search engines, local code tools, databases, and APIs.
            </Text>
          </Stack>
        </div>

        {/* Feature 3 */}
        <div className="onboarding-feature-item">
          <div className="onboarding-feature-icon">
            <IconBolt size={22} stroke={1.5} />
          </div>
          <Stack gap="3xs" style={{ flex: 1 }}>
            <Text fw={600} size="sm" c="zinc.4">
              Agent Automations
            </Text>
            <Text size="xs" c="zinc.4" style={{ lineHeight: 1.4 }}>
              Run background agents to execute complex operations, fetch live data, and generate scheduled reports.
            </Text>
          </Stack>
        </div>
      </Stack>

      <Group justify="center" mt="xs">
        <Button
          variant="default"
          onClick={toggleColorScheme}
          leftSection={isDark ? <IconSun size={14} /> : <IconMoon size={14} />}
          size="xs"
          radius="md"
          styles={{
            root: {
              borderColor: 'light-dark(var(--mantine-color-zinc-2), var(--mantine-color-zinc-8))',
              backgroundColor: 'light-dark(var(--mantine-color-zinc-0), var(--mantine-color-zinc-9))',
            }
          }}
        >
          {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </Button>
      </Group>
    </Stack>
  );
};

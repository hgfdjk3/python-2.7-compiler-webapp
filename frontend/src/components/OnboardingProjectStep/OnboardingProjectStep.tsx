import React from 'react';
import { Box, Title, Text, Stack, TextInput, Alert } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import './OnboardingProjectStep.css';

interface OnboardingProjectStepProps {
  projectName: string;
  setProjectName: (name: string) => void;
}

export const OnboardingProjectStep: React.FC<OnboardingProjectStepProps> = ({
  projectName,
  setProjectName,
}) => {
  return (
    <Stack gap="lg">
      <Box>
        <Title className="onboarding-project-title" mb="xs">
          Create Your First Project
        </Title>
        <Text c="zinc.4" size="sm" style={{ lineHeight: 1.5 }}>
          Projects are isolated workspaces. They store your chats, connected data sources, and custom research graphs.
        </Text>
      </Box>

      <Box className="onboarding-project-input-container">
        <TextInput
          label="What should we name your first workspace?"
          placeholder="e.g. My Research Workspace"
          value={projectName}
          onChange={(e) => setProjectName(e.currentTarget.value)}
          size="md"
          radius="md"
          required
          styles={{
            label: {
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 'var(--mantine-font-size-xs)',
              color: 'var(--mantine-color-zinc-4)',
            },
            input: {
              backgroundColor: 'light-dark(var(--mantine-color-zinc-0), var(--mantine-color-zinc-9))',
              borderColor: 'light-dark(var(--mantine-color-zinc-2), var(--mantine-color-zinc-8))',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              '&:focus': {
                borderColor: 'var(--mantine-color-zinc-6)',
              }
            }
          }}
        />
      </Box>

      <Alert
        variant="light"
        color="zinc"
        radius="md"
        title="Quick Launch"
        icon={<IconSparkles size={16} />}
        styles={{
          title: {
            fontWeight: 700,
            fontSize: 'var(--mantine-font-size-sm)',
            lineHeight: 1.2,
            marginBottom: 4,
          },
          message: {
            fontSize: 'var(--mantine-font-size-xs)',
            lineHeight: 1.4,
            color: 'var(--mantine-color-zinc-4)',
          }
        }}
      >
        We'll set up your chats and prepare the database schema for this project immediately.
      </Alert>
    </Stack>
  );
};

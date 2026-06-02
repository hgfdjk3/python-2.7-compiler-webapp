import React from 'react';
import { Card, Group, Text, ThemeIcon, Button, Box, useMantineTheme } from '@mantine/core';
import { IconBolt, IconArrowRight } from '@tabler/icons-react';
import { useChatStore } from '@/store/chatStore';

export const AutomationModeBlock: React.FC = () => {
  const theme = useMantineTheme();
  const setIsAutomationMode = useChatStore((state) => state.setIsAutomationMode);


  return (
    <Card
      withBorder
      p="lg"
      radius="md"
      mt="sm"
      style={{
        borderColor: `light-dark(${theme.colors.orange[4]}, ${theme.colors.orange[8]})`,
        backgroundColor: `light-dark(${theme.colors.orange[0]}, ${theme.colors.orange[9]}20)`,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="center">
        <Group wrap="nowrap">
          <ThemeIcon size="xl" radius="md" variant="light" color="orange">
            <IconBolt size={24} />
          </ThemeIcon>
          <Box>
            <Text fw={600} size="md" c="orange.7">Create an Automation</Text>
            <Text size="sm" c="dimmed">It looks like you want to build a workflow. Switch to Automation Mode to generate and manage automations.</Text>
          </Box>
        </Group>
        <Button
          variant="filled"
          color="orange"
          rightSection={<IconArrowRight size={16} />}
          onClick={() => setIsAutomationMode(true)}
          radius="md"
        >
          Switch Mode
        </Button>
      </Group>
    </Card>
  );
};

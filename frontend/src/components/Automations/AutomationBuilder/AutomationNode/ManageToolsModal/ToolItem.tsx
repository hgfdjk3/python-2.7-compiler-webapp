import React from 'react';
import { Box, Group, ThemeIcon, Text, ActionIcon } from '@mantine/core';

export interface ToolItemProps {
  toolInfo: {
    name: string;
    icon: React.ReactNode;
    color: string;
  };
  actionIcon: React.ReactNode;
  onAction: () => void;
  actionColor?: string;
  padding?: string;
  withBackground?: boolean;
}

export const ToolItem: React.FC<ToolItemProps> = ({
  toolInfo,
  actionIcon,
  onAction,
  actionColor = "dimmed",
  padding = '5px',
  withBackground = false
}) => {
  return (
    <Box
      style={{
        padding,
        borderRadius: 'var(--mantine-radius-sm)',
        backgroundColor: withBackground ? 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))' : undefined,
        border: '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
      }}
    >
      <Group wrap="nowrap" justify="space-between">
        <Group wrap="nowrap" gap="sm" style={{ overflow: 'hidden' }}>
          <ThemeIcon
            variant="outline"
            size="md"
            radius="sm"
            style={{
              border: `1px solid ${toolInfo.color}`,
              color: toolInfo.color,
              flexShrink: 0
            }}
          >
            {toolInfo.icon}
          </ThemeIcon>
          <Text size="sm" fw={500} truncate>
            {toolInfo.name}
          </Text>
        </Group>
        <ActionIcon
          variant="light"
          color={actionColor}
          onClick={onAction}
        >
          {actionIcon}
        </ActionIcon>
      </Group>
    </Box>
  );
};

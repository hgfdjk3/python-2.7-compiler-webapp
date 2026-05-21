import React from 'react';
import { Box, Flex, Stack, Text, Group, ActionIcon } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { IconEdit, IconCopy } from '@tabler/icons-react';

export interface UserMessageProps {
  content: string;
  timestamp?: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({ content, timestamp }) => {
  const { hovered, ref } = useHover();

  return (
    <Flex justify="flex-end" w={{ base: '100%', md: 800, lg: 1100 }} pt="xs" mx="auto" ref={ref}>
      <Stack align="flex-end" gap={4} style={{ maxWidth: '85%' }}>
        <Box
          px="md"
          py="sm"
          style={{
            backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
            borderRadius: '18px 18px 4px 18px',
            border: '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
            transition: 'transform 0.1s ease',
          }}
        >
          <Text size="md" c="light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-1))" style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {content}
          </Text>
        </Box>

        <Group
          gap={8}
          h={20}
          px={4}

        >
          {timestamp && (
            <Text size="xs" c="dimmed" style={{
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
              pointerEvents: hovered ? 'all' : 'none'
            }} fw={500}>
              {timestamp}
            </Text>
          )}
          <Group gap={4}>
            <ActionIcon variant="subtle" size="sm" color="gray" aria-label="Edit message">
              <IconEdit size={14} stroke={1.5} />
            </ActionIcon>
            <ActionIcon variant="subtle" size="sm" color="gray" aria-label="Copy message">
              <IconCopy size={14} stroke={1.5} />
            </ActionIcon>
          </Group>
        </Group>
      </Stack>
    </Flex>
  );
};

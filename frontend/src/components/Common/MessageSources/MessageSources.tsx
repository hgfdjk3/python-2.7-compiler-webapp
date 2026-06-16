import React from 'react';
import { Menu, Stack, Text, ActionIcon, Group } from '@mantine/core';
import { IconClipboard, IconDatabase, IconLibrary } from '@tabler/icons-react';
import { Source } from '../../Project/Sources/types';
import { PromptInputSourceBadge } from '../../Project/Chat/PromptInput/PromptInputSourceBadge';

export interface MessageSourcesProps {
  sources: Source[];
}

export const MessageSources: React.FC<MessageSourcesProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <Menu
      shadow="xl"
      trigger="hover"
      openDelay={100}
      closeDelay={200}
      withArrow={false}
      radius="md"
      position="top-start"
      offset={4}
    >
      <Menu.Target>
        <ActionIcon size="md" variant="light" color="gray" radius="xl" style={{ width: 'auto', paddingLeft: 8, paddingRight: 8 }}>
          <Group gap={4} wrap="nowrap">
            <IconLibrary size={14} stroke={2} />
            <Text size="xs" fw={600} lh={1}>{sources.length}</Text>
          </Group>
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown p="xs" style={{ minWidth: 220, border: '1px solid var(--mantine-color-default-border)' }}>
        <Menu.Label pb="xs" pt={4}>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: 0.5 }}>
            Attached Sources
          </Text>
        </Menu.Label>

        <Stack gap={6}>
          {sources.map((source) => (
            <PromptInputSourceBadge
              key={source.id}
              source={source}
              justify="space-between"
              fullWidth
              styles={{
                root: { paddingLeft: 12, paddingRight: 6, height: 28 },
                label: { flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }
              }}
            />
          ))}
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
};

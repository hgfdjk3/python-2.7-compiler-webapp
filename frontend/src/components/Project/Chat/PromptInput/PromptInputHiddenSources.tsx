import React from 'react';
import { ActionIcon, Button, Menu, Stack, Text } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { Source } from '../../Sources/types';
import { PromptInputSourceBadge } from './PromptInputSourceBadge';
import Counter from '../../../animations/Counter';

export interface PromptInputHiddenSourcesProps {
  hiddenSources: Source[];
  onDetachSource?: (sourceId: string) => void;
}

export const PromptInputHiddenSources: React.FC<PromptInputHiddenSourcesProps> = ({
  hiddenSources,
  onDetachSource,
}) => {
  if (hiddenSources.length === 0) return null;

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
        <Button size="xs" variant="light" color="gray" radius="xl" fw={600}>
          +<Counter value={hiddenSources.length} />
          &nbsp;
          Source{hiddenSources.length === 1 ? '' : 's'}
        </Button>
      </Menu.Target>

      <Menu.Dropdown p="xs" style={{ minWidth: 220, border: '1px solid var(--mantine-color-default-border)' }}>
        <Menu.Label pb="xs" pt={4}>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: 0.5 }}>
            Additional Sources
          </Text>
        </Menu.Label>

        <Stack gap={6}>
          {hiddenSources.map((source) => (
            <PromptInputSourceBadge
              key={source.id}
              source={source}
              onDetachSource={onDetachSource}
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

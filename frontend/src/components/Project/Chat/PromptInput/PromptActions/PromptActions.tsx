import React from 'react';
import { Menu, ActionIcon, rem, useMantineTheme, Text } from '@mantine/core';
import { IconPlus, IconFiles, IconRobot, IconChevronRight } from '@tabler/icons-react';

import './PromptActions.css';

export interface PromptActionsProps {
  onAttachSource?: () => void;
  onManageAgents?: () => void;
}

export const PromptActions: React.FC<PromptActionsProps> = ({
  onAttachSource,
  onManageAgents,
}) => {
  const theme = useMantineTheme();

  return (
    <Menu
      shadow="xl"
      width={220}
      position="top-start"
      offset={12}
      withArrow={false}
      radius="md"
      transitionProps={{ transition: 'pop-bottom-left', duration: 150 }}
      withinPortal
    >
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="md"
          radius="md"
          className="promptActionButton"
          aria-label="Add options"
        >
          <IconPlus size={20} stroke={1.5} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown p={6} style={{ border: '1px solid var(--mantine-color-default-border)' }}>
        <Menu.Label pb={rem(4)} pt={rem(4)}>
          <Text size="10px" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.05em' }}>
            Add Content
          </Text>
        </Menu.Label>

        <Menu.Item
          leftSection={<IconFiles style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
          rightSection={<IconChevronRight style={{ width: rem(14), height: rem(14) }} stroke={1.5} className="itemChevron" />}
          onClick={onAttachSource}
          className="promptActionItem"
        >
          Add sources
        </Menu.Item>
        <Menu.Item
          leftSection={<IconRobot style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
          rightSection={<IconChevronRight style={{ width: rem(14), height: rem(14) }} stroke={1.5} className="itemChevron" />}
          onClick={onManageAgents}
          className="promptActionItem"
        >
          Add/manage Agents
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

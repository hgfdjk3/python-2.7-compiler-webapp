import React from 'react';
import { Group, ThemeIcon, Text, ActionIcon, Menu } from '@mantine/core';
import { IconRobot, IconSparkles, IconDotsVertical, IconEdit, IconCopy, IconTrash } from '@tabler/icons-react';

interface AutomationNodeHeaderProps {
  title: string;
  isRewriting: boolean;
  onToggleRewrite: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export const AutomationNodeHeader: React.FC<AutomationNodeHeaderProps> = ({
  title,
  isRewriting,
  onToggleRewrite,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  return (
    <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
      <Group gap="xs" style={{ flex: 1 }}>
        <ThemeIcon variant="light" color="blue" size="md" radius="md">
          <IconRobot size={18} stroke={1.5} />
        </ThemeIcon>
        <Text fw={700} size="md" c="bright" truncate>{title}</Text>
      </Group>

      <Group gap={4} className="nodrag">
        <ActionIcon 
          variant={isRewriting ? 'filled' : 'subtle'} 
          color="blue" 
          size="md" 
          onClick={onToggleRewrite}
          radius="md"
        >
          <IconSparkles size={18} />
        </ActionIcon>

        <Menu shadow="md" width={160} position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="md" radius="md">
              <IconDotsVertical size={18} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={onEdit}>Edit</Menu.Item>
            <Menu.Item leftSection={<IconCopy size={14} />} onClick={onDuplicate}>Duplicate</Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={onDelete}>Delete</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
};

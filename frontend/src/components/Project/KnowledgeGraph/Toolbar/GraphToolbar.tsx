import React from 'react';
import { Group, Paper, Divider } from '@mantine/core';
import { IconEdit, IconLink, IconGitMerge, IconTrash } from '@tabler/icons-react';
import { ToolbarButton } from './ToolbarButton';

interface GraphToolbarProps {
  selectedNodeIds: string[];
  onEdit: () => void;
  onConnect: () => void;
  onMerge: () => void;
  onDelete: () => void;
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({
  selectedNodeIds = [],
  onEdit,
  onConnect,
  onMerge,
  onDelete,
}) => {
  const selectionCount = selectedNodeIds.length;

  return (
    <Paper
      shadow="md"
      radius="xl"
      p="xs"
      withBorder
      style={{
        backdropFilter: 'blur(10px)',
        backgroundColor: 'color-mix(in srgb, var(--mantine-color-body) 80%, transparent)',
      }}
    >
      <Group gap="xs">
        <ToolbarButton
          icon={<IconEdit size={18} />}
          label="Edit Entity (Select 1)"
          color="blue"
          disabled={selectionCount !== 1}
          onClick={onEdit}
        />
        <Divider orientation="vertical" />
        <ToolbarButton
          icon={<IconLink size={18} />}
          label="Connect Entities (Select 2)"
          color="teal"
          disabled={selectionCount !== 2}
          onClick={onConnect}
        />
        <ToolbarButton
          icon={<IconGitMerge size={18} />}
          label="Merge Entities (Select 2)"
          color="grape"
          disabled={selectionCount !== 2}
          onClick={onMerge}
        />
        <Divider orientation="vertical" />
        <ToolbarButton
          icon={<IconTrash size={18} />}
          label="Delete Entity (Select 1+)"
          color="red"
          disabled={selectionCount < 1}
          onClick={onDelete}
        />
      </Group>
    </Paper>
  );
};

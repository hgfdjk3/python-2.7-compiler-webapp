import React from 'react';
import { Card, Group, ThemeIcon, Text, Box } from '@mantine/core';
import { useDroppable } from '@dnd-kit/react';
import { IconPlus } from '@tabler/icons-react';
import './CreateGroupZone.css';

export interface CreateGroupZoneProps {
  id: string;
  isDragging?: boolean;
}

export const CreateGroupZone: React.FC<CreateGroupZoneProps> = ({ id, isDragging }) => {
  const { ref, isDropTarget: isOver } = useDroppable({ id });

  return (
    <Card
      ref={ref}
      withBorder
      p="xs"
      radius="sm"
      className="createGroupZoneRoot"
      data-over={isOver || undefined}
      data-dragging={isDragging || undefined}
    >
      <Group gap="sm">
        <ThemeIcon 
          variant="light" 
          color={isOver ? 'blue' : 'gray'} 
          size="md"
        >
          <IconPlus size={16} />
        </ThemeIcon>
        
        <Box style={{ flex: 1 }}>
          <Text size="xs" fw={500} c={isOver ? 'blue' : undefined}>
            Create New Group
          </Text>
          <Text size="10px" c="dimmed">
            Drop items here to organize them
          </Text>
        </Box>
      </Group>
    </Card>
  );
};

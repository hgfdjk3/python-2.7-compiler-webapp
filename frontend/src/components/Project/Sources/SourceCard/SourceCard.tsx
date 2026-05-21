import React from 'react';
import { Card, Group, Text, ThemeIcon, Box, UnstyledButton } from '@mantine/core';
import { IconPdf, IconFileText, IconExternalLink, IconGripVertical, IconCheck } from '@tabler/icons-react';
import { useHover, useMergedRef } from '@mantine/hooks';
import { useDraggable } from '@dnd-kit/react';
import { Source, SourceType } from '../types';
import { SourceCardMenu } from './SourceCardMenu';

import './SourceCard.css';

interface SourceCardProps {
  source: Source;
  isOverlay?: boolean;
  isDraggingAny?: boolean;
  onRemove?: (id: string) => void;
  onGoToSource?: (id: string) => void;
  onRename?: (id: string) => void;
  selected?: boolean;
  onClick?: () => void;
}

const getIcon = (type: SourceType) => {
  switch (type) {
    case 'pdf': return <IconPdf size={16} />;
    case 'doc': return <IconFileText size={16} />;
    case 'link': return <IconExternalLink size={16} />;
    default: return <IconFileText size={16} />;
  }
};

export const SourceCard: React.FC<SourceCardProps> = ({
  source,
  isOverlay,
  isDraggingAny,
  onRemove,
  onGoToSource,
  onRename,
  selected,
  onClick,
}) => {
  const { hovered, ref: hoverRef } = useHover();
  const { ref: dragRef, handleRef, isDragging } = useDraggable({
    id: source.id,
    data: source,
    disabled: isOverlay,
  });

  const mergedRef = useMergedRef(dragRef, hoverRef);

  return (
    <Card
      ref={mergedRef}
      withBorder
      p="xs"
      pl="5"
      radius="sm"
      className={`sourceCardRoot ${selected ? 'selected' : ''}`}
      data-dragging={isDragging || undefined}
      data-dragging-any={isDraggingAny || undefined}
      shadow={isDragging ? 'md' : 'none'}
      onClick={onClick}
      style={{
        borderLeft: source.color ? `4px solid var(--mantine-color-${source.color}-6)` : undefined,
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <Group wrap="nowrap" gap="xs">
        <Group wrap="nowrap" gap="5">
          <Box ref={handleRef} className="dragHandle">
            <IconGripVertical size={16} color="var(--mantine-color-gray-5)" />
          </Box>

          <ThemeIcon variant="light" color={source.color || 'gray'} size="md">
            {getIcon(source.type)}
          </ThemeIcon>
        </Group>

        <Box className="sourceCardInfo">
          <Text size="xs" fw={500} truncate>
            {source.title}
          </Text>
          <Text size="10px" c="dimmed" truncate>
            {source.description}
          </Text>
        </Box>

        {!isOverlay && !selected && (
          <SourceCardMenu
            visible={hovered || isDragging}
            onGoToSource={() => onGoToSource?.(source.id)}
            onRemove={() => onRemove?.(source.id)}
            onRename={() => onRename?.(source.id)}
          />
        )}

        {selected && (
          <Box className="selectedCheck">
            <IconCheck size={14} stroke={3} />
          </Box>
        )}
      </Group>
    </Card>
  );
};

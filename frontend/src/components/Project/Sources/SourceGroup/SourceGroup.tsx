import React, { useState } from 'react';
import { Box, Paper, Stack, Text, Group, ActionIcon, ThemeIcon } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDroppable } from '@dnd-kit/react';
import { SourceGroup as SourceGroupType, SourceType } from '../types';
import { SourceCard } from '../SourceCard/SourceCard';
import { SourceGroupSummary } from './SourceGroupSummary';

import './SourceGroup.css';

interface SourceGroupProps {
  group: SourceGroupType;
  isDraggingAny?: boolean;
  attachedSourceIds?: string[];
  onToggleSource?: (sourceId: string) => void;
}

export const SourceGroup: React.FC<SourceGroupProps> = ({ 
  group, 
  isDraggingAny = false,
  attachedSourceIds = [],
  onToggleSource
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { ref, isDropTarget: isOver } = useDroppable({
    id: group.id,
    data: group,
  });

  return (
    <Box
      ref={ref}
      className="sourceGroupRoot"
    >
      <Paper
        withBorder
        p="xs"
        radius="md"
        className="sourceGroupPaper"
        data-over={isOver || undefined}
        data-dragging={isDraggingAny || undefined}
      >
        {isDraggingAny && !isOver && (
          <Box className="dragOverlayTint" />
        )}
        <Group justify="space-between" align="flex-start" mb={isExpanded ? 'xs' : 0} wrap="nowrap">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={600} truncate>
              {group.title}
            </Text>

            {isExpanded ? (
              group.description && (
                <Text size="xs" c="dimmed" truncate>
                  {group.description}
                </Text>
              )
            ) : (
              <Group gap="xs" wrap="nowrap">
                <SourceGroupSummary sources={group.sources} />
              </Group>
            )}
          </Box>

          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          >
            <IconChevronDown size={14} />
          </ActionIcon>
        </Group>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <Stack gap="5" >
                {(group.sources || []).length > 0 ? (
                  (group.sources || []).map((source) => (
                    <SourceCard 
                      key={source.id} 
                      source={source} 
                      selected={attachedSourceIds.includes(source.id)}
                      onClick={onToggleSource ? () => onToggleSource(source.id) : undefined}
                    />
                  ))
                ) : (
                  <Text size="xs" c="dimmed" ta="center" py="md">
                    Drop sources here
                  </Text>
                )}
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>
    </Box>
  );
};

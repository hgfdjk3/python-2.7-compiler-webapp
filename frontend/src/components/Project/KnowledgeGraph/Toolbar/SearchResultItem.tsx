import React, { useState } from 'react';
import { Box, Group, Text, Stack, Badge } from '@mantine/core';
import { Entity } from '../../../../api/library';

interface SearchResultItemProps {
  entity: Entity;
  isLast: boolean;
  isActive?: boolean;
  typeColor: string;
  onClick: (id: string) => void;
  onMouseEnter?: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  entity,
  isLast,
  isActive,
  typeColor,
  onClick,
  onMouseEnter
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const state = entity.current_state || entity.proposed_state;
  const relatedCount = state?.related_entities?.length || 0;

  const activeStyle = isActive || isHovered;

  return (
    <Box 
      p="sm" 
      data-active={isActive}
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        cursor: 'pointer', 
        borderBottom: !isLast ? '1px solid var(--mantine-color-default-border)' : 'none',
        backgroundColor: activeStyle ? 'var(--mantine-color-default-hover)' : 'transparent',
        transition: 'background-color 0.15s ease'
      }}
      onClick={() => onClick(entity.id)}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} truncate>{state?.title || entity.type}</Text>
          <Text size="xs" c="dimmed" lineClamp={2} mt={2}>{state?.description}</Text>
        </div>
        <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
          <Badge size="xs" variant="light" color={typeColor}>{entity.type}</Badge>
          <Text size="xs" c="dimmed">{relatedCount} connections</Text>
        </Stack>
      </Group>
    </Box>
  );
};

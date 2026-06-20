import React, { useState } from 'react';
import { Paper, Group, TextInput, Menu, ActionIcon, Badge, Popover, Text, Stack, ScrollArea, Box, useMantineTheme } from '@mantine/core';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { Entity } from '../../../../api/library';

interface GraphSearchWidgetProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableTypes: string[];
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  entities: Entity[];
  typeColors: Record<string, string>;
  onResultClick: (entityId: string) => void;
}

export const GraphSearchWidget: React.FC<GraphSearchWidgetProps> = ({
  searchQuery,
  onSearchChange,
  availableTypes,
  selectedTypes,
  onToggleType,
  entities,
  typeColors,
  onResultClick
}) => {
  const [opened, setOpened] = useState(false);
  const theme = useMantineTheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter entities based on query and types to show in the dropdown
  const filteredEntities = entities.filter(e => {
    const label = (e.current_state?.title || e.proposed_state?.title || e.type).toLowerCase();
    const matchesSearch = searchQuery ? label.includes(searchQuery.toLowerCase()) : true;
    const matchesType = selectedTypes.length > 0 ? selectedTypes.includes(e.type) : true;
    return matchesSearch && matchesType;
  });

  const showDropdown = opened && (searchQuery.length > 0 || selectedTypes.length > 0) && filteredEntities.length > 0;

  return (
    <Popover 
      opened={showDropdown} 
      position="bottom-end" 
      width={340} 
      shadow="xl" 
      offset={8}
      transitionProps={{ transition: 'pop-top-right', duration: 200 }}
      withArrow
    >
      <Popover.Target>
        <Paper 
          shadow="md" 
          radius="xl" 
          withBorder 
          style={{ 
            position: 'absolute', 
            top: 20, 
            right: 20, 
            zIndex: 10,
            backdropFilter: 'blur(10px)', 
            backgroundColor: 'color-mix(in srgb, var(--mantine-color-body) 80%, transparent)' 
          }}
        >
          <Group gap={0}>
            <TextInput
              placeholder="Search graph..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              onFocus={() => setOpened(true)}
              onBlur={() => setTimeout(() => setOpened(false), 200)}
              leftSection={<IconSearch size={14} />}
              variant="unstyled"
              size="sm"
              w={220}
              pl="sm"
            />
            
            <Menu shadow="md" width={200} closeOnItemClick={false}>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="lg" radius="xl" mr="xs">
                  <IconFilter size={18} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Filter by Type</Menu.Label>
                {availableTypes.map(type => (
                  <Menu.Item 
                    key={type} 
                    onClick={() => onToggleType(type)}
                    leftSection={
                      <Badge 
                        size="xs" 
                        color={typeColors[type] || typeColors.default} 
                        variant={selectedTypes.includes(type) ? 'filled' : 'light'} 
                        circle 
                      />
                    }
                  >
                    <span style={{ textTransform: 'capitalize' }}>{type}</span>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Paper>
      </Popover.Target>

      <Popover.Dropdown p={0} style={{ overflow: 'hidden', borderRadius: theme.radius.md }}>
        <ScrollArea h={Math.min(filteredEntities.length * 76, 400)} type="scroll">
          <Stack gap={0}>
            {filteredEntities.map((entity, index) => {
              const state = entity.current_state || entity.proposed_state;
              const relatedCount = state?.related_entities?.length || 0;
              const isHovered = hoveredId === entity.id;
              
              return (
                <Box 
                  key={entity.id} 
                  p="sm" 
                  onMouseEnter={() => setHoveredId(entity.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ 
                    cursor: 'pointer', 
                    borderBottom: index < filteredEntities.length - 1 ? '1px solid var(--mantine-color-default-border)' : 'none',
                    backgroundColor: isHovered ? 'var(--mantine-color-default-hover)' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onClick={() => {
                    onResultClick(entity.id);
                    setOpened(false);
                  }}
                >
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={600} truncate>{state?.title || entity.type}</Text>
                      <Text size="xs" c="dimmed" lineClamp={2} mt={2}>{state?.description}</Text>
                    </div>
                    <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
                      <Badge size="xs" variant="light" color={typeColors[entity.type] || typeColors.default}>{entity.type}</Badge>
                      <Text size="xs" c="dimmed">{relatedCount} connections</Text>
                    </Stack>
                  </Group>
                </Box>
              );
            })}
          </Stack>
        </ScrollArea>
      </Popover.Dropdown>
    </Popover>
  );
};

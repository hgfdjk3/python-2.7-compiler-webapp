import React, { useState } from 'react';
import { Paper, Group, TextInput, Menu, ActionIcon, Badge, Popover, Text, Stack, ScrollArea, Box, useMantineTheme } from '@mantine/core';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { Entity } from '../../../../api/library';
import { SearchResultItem } from './SearchResultItem';

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
  const [activeIndex, setActiveIndex] = useState(-1);
  const theme = useMantineTheme();
  const viewportRef = React.useRef<HTMLDivElement>(null);

  // Reset active index when search changes
  React.useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery, selectedTypes, opened]);

  // Scroll to active item
  React.useEffect(() => {
    if (activeIndex >= 0 && viewportRef.current) {
      const activeElement = viewportRef.current.querySelector(`[data-active="true"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  // Filter entities based on query and types to show in the dropdown
  const filteredEntities = entities.filter(e => {
    const label = (e.current_state?.title || e.proposed_state?.title || e.type).toLowerCase();
    const matchesSearch = searchQuery ? label.includes(searchQuery.toLowerCase()) : true;
    const matchesType = selectedTypes.length > 0 ? selectedTypes.includes(e.type) : true;
    return matchesSearch && matchesType;
  });

  const showDropdown = opened && (searchQuery.length > 0 || selectedTypes.length > 0) && filteredEntities.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filteredEntities.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredEntities.length) {
        onResultClick(filteredEntities[activeIndex].id);
        setOpened(false);
        setActiveIndex(-1);
      } else if (filteredEntities.length > 0) {
        onResultClick(filteredEntities[0].id);
        setOpened(false);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setOpened(false);
    }
  };

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
          w={340}
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
          <Group gap={0} w="100%" justify="space-between">
            <TextInput
              placeholder="Search graph..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              onFocus={() => setOpened(true)}
              onBlur={() => setTimeout(() => setOpened(false), 200)}
              onKeyDown={handleKeyDown}
              leftSection={<IconSearch size={14} />}
              variant="unstyled"
              size="sm"
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
        <ScrollArea h={Math.min(filteredEntities.length * 76, 650)} scrollbarSize={4} viewportRef={viewportRef} type="scroll">
          <Stack gap={0}>
            {filteredEntities.map((entity, index) => (
              <SearchResultItem
                key={entity.id}
                entity={entity}
                isLast={index === filteredEntities.length - 1}
                isActive={index === activeIndex}
                typeColor={typeColors[entity.type] || typeColors.default}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={(id) => {
                  onResultClick(id);
                  setOpened(false);
                }}
              />
            ))}
          </Stack>
        </ScrollArea>
      </Popover.Dropdown>
    </Popover>
  );
};

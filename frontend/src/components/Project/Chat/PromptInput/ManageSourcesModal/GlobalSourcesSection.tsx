import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Box,
  Stack,
  Text,
  TextInput,
  ActionIcon,
  Group,
  UnstyledButton,
  ScrollArea,
  Button,
  useMantineTheme
} from '@mantine/core';
import {
  IconSearch,
  IconX,
  IconPdf,
  IconFileText,
  IconExternalLink,
  IconPlus,
} from '@tabler/icons-react';
import { Source, SourceType } from '../../../Sources/types';
import { SourceCard } from '../../../Sources/SourceCard/SourceCard';

export interface GlobalSourcesSectionProps {
  globalSources: Source[];
  projectSourceIds: string[];
  onAddToProject: (sourceIds: string[]) => void;
}

const TYPE_ICONS: Record<SourceType, React.ReactNode> = {
  pdf: <IconPdf size={16} />,
  txt: <IconFileText size={16} />,
  link: <IconExternalLink size={16} />,
  doc: <IconFileText size={16} />,
};

export const GlobalSourcesSection: React.FC<GlobalSourcesSectionProps> = ({
  globalSources = [],
  projectSourceIds = [],
  onAddToProject,
}) => {
  const theme = useMantineTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<SourceType | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredGlobalSources = useMemo(() => {
    return globalSources.filter((source) => {
      const matchesSearch =
        source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeType === 'all' || source.type === activeType;
      return matchesSearch && matchesType;
    });
  }, [globalSources, searchQuery, activeType]);

  // Sources that are not yet in the project
  const availableSources = useMemo(() => {
    return filteredGlobalSources.filter(
      (source) => !projectSourceIds.includes(source.id)
    );
  }, [filteredGlobalSources, projectSourceIds]);

  // Sources already in the project
  const alreadyAddedSources = useMemo(() => {
    return filteredGlobalSources.filter((source) =>
      projectSourceIds.includes(source.id)
    );
  }, [filteredGlobalSources, projectSourceIds]);

  const handleToggleSelection = (sourceId: string) => {
    setSelectedIds((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleAddSelected = () => {
    if (selectedIds.length === 0) return;
    onAddToProject(selectedIds);
    setSelectedIds([]);
  };

  const types: (SourceType | 'all')[] = ['all', 'pdf', 'txt', 'link', 'doc'];

  return (
    <motion.div
      transition={{ duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <Stack gap="sm" h="100%" style={{ borderLeft: `1px solid light-dark(${theme.colors.gray[2]}, ${theme.colors.dark[6]})`, paddingLeft: 'var(--mantine-spacing-xl)' }}>
        <Box mb="xs">
          <Text fw={600} size="md">Global Sources</Text>
          <Text size="sm" c="dimmed">Select &amp; add to project, or drag them over</Text>
        </Box>

        <TextInput
          placeholder="Search global sources..."
          leftSection={<IconSearch size={16} stroke={1.5} />}
          rightSection={
            searchQuery && (
              <ActionIcon variant="subtle" color="gray" onClick={() => setSearchQuery('')}>
                <IconX size={14} />
              </ActionIcon>
            )
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          size="sm"
          classNames={{ input: 'searchInput' }}
        />

        <Group gap="xs" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {types.map((type) => (
            <UnstyledButton
              key={type}
              className={`typeFilterButton ${activeType === type ? 'active' : ''}`}
              onClick={() => setActiveType(type)}
            >
              <Group gap={6} wrap="nowrap">
                {type !== 'all' && TYPE_ICONS[type as SourceType]}
                <Text size="sm" fw={500} tt="capitalize">
                  {type}
                </Text>
              </Group>
            </UnstyledButton>
          ))}
        </Group>

        <ScrollArea h={320} offsetScrollbars scrollbars="y" mt="xs">
          <Stack gap="xs" pr="sm">
            <AnimatePresence mode="popLayout">
              {availableSources.length > 0 && (
                availableSources.map((source) => (
                  <motion.div
                    key={source.id}
                    layout
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SourceCard
                      source={source}
                      selected={selectedIds.includes(source.id)}
                      onClick={() => handleToggleSelection(source.id)}
                    />
                  </motion.div>
                ))
              )}

              {alreadyAddedSources.length > 0 && (
                <motion.div
                  key="already-added-label"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Text size="xs" c="dimmed" fw={500} mt="sm" mb={4}>
                    Already in project
                  </Text>
                </motion.div>
              )}

              {alreadyAddedSources.map((source) => (
                <motion.div
                  key={source.id}
                  layout
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 0.5, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                  style={{ pointerEvents: 'none' }}
                >
                  <SourceCard
                    source={source}
                    selected={false}
                  />
                </motion.div>
              ))}

              {filteredGlobalSources.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Box py="xl" ta="center">
                    <Text c="dimmed" size="sm">
                      No global sources found.
                    </Text>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Stack>
        </ScrollArea>

        <Box mt="auto" pt="md">
          <AnimatePresence mode="wait">
            {selectedIds.length > 0 ? (
              <motion.div
                key="add-button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  fullWidth
                  variant="filled"
                  size="sm"
                  leftSection={<IconPlus size={16} />}
                  onClick={handleAddSelected}
                >
                  Add {selectedIds.length} source{selectedIds.length !== 1 ? 's' : ''} to Project
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="hint-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Text size="sm" c="dimmed" ta="center">
                  Select sources to add to your project
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Stack>
    </motion.div>
  );
};

import React from 'react';
import { Box, Stack, Text, ScrollArea } from '@mantine/core';
import { motion, AnimatePresence } from 'motion/react';
import { Source, SourceGroup as SourceGroupType } from '../../../Sources/types';
import { SourceCard } from '../../../Sources/SourceCard/SourceCard';
import { SourceGroup } from '../../../Sources/SourceGroup/SourceGroup';

export interface ProjectSourcesSectionProps {
  standaloneSources: Source[];
  groups: SourceGroupType[];
  attachedSourceIds: string[];
  onToggleSource: (sourceId: string) => void;
  dropRef: (element: HTMLElement | null) => void;
  isOver: boolean;
}

export const ProjectSourcesSection: React.FC<ProjectSourcesSectionProps> = ({
  standaloneSources = [],
  groups = [],
  attachedSourceIds = [],
  onToggleSource,
  dropRef,
  isOver,
}) => {
  return (
    <motion.div
      transition={{ duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <Stack gap="xs" h="100%">
        <Box mb="md">
          <Text fw={600} size="md">Project Sources</Text>
          <Text size="sm" c="dimmed">Select sources to attach to your prompt</Text>
        </Box>

        <Box
          ref={dropRef}
          className={`projectSourcesDropZone ${isOver ? 'active' : ''}`}
        >
          <ScrollArea h={450} offsetScrollbars scrollbars="y" scrollbarSize={4}>
            <Stack gap="sm" >
              <AnimatePresence mode="popLayout">
                {groups.map((group) => (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SourceGroup
                      group={group}
                      attachedSourceIds={attachedSourceIds}
                      onToggleSource={onToggleSource}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {standaloneSources.length > 0 && (
                <Stack gap="xs">
                  <AnimatePresence mode="popLayout">
                    {standaloneSources.map((source) => (
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
                          selected={attachedSourceIds.includes(source.id)}
                          onClick={() => onToggleSource(source.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Stack>
              )}

              {groups.length === 0 && standaloneSources.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Box py="xl" ta="center">
                    <Text c="dimmed" size="sm">
                      No project sources.
                    </Text>
                    <Text c="dimmed" size="xs" mt="xs">
                      Drag sources from the right to add them.
                    </Text>
                  </Box>
                </motion.div>
              )}
            </Stack>
          </ScrollArea>
        </Box>
      </Stack>
    </motion.div>
  );
};

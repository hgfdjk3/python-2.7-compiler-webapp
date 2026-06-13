import React, { useState, useMemo } from 'react';
import { Stack, Box, Text, ScrollArea } from '@mantine/core';
import { DragOverlay, useDroppable } from '@dnd-kit/react';
import { Source, SourceGroup as SourceGroupType } from '../types';
import { SourceGroup } from '../SourceGroup/SourceGroup';
import { SourceCard } from '../SourceCard/SourceCard';
import { SourceFilter } from '../SourceFilter/SourceFilter';
import { useSourceFilter } from '../useSourceFilter';
import './ProjectSourcesPreview.css';

interface ProjectSourcesPreviewProps {
  initialGroups: SourceGroupType[];
  standaloneSources: Source[];
  activeSourceId: string | null;
}

export const ProjectSourcesPreview: React.FC<ProjectSourcesPreviewProps> = ({
  initialGroups,
  standaloneSources,
  activeSourceId,
}) => {
  const activeSource = activeSourceId
    ? [...standaloneSources, ...initialGroups.flatMap((group) => group.sources)].find((source) => source.id === activeSourceId)
    : null;

  return (
    <ProjectSourcesPreviewContent
      groups={initialGroups}
      sources={standaloneSources}
      activeSource={activeSource || null}
      isDraggingAny={!!activeSourceId}
    />
  );
};

interface ProjectSourcesPreviewContentProps {
  groups: SourceGroupType[];
  sources: Source[];
  activeSource: Source | null;
  isDraggingAny: boolean;
}

const ProjectSourcesPreviewContent: React.FC<ProjectSourcesPreviewContentProps> = ({
  groups,
  sources,
  activeSource,
  isDraggingAny
}) => {
  const { ref: standaloneRef, isDropTarget: isOverStandalone } = useDroppable({ id: 'standalone-zone' });

  const {
    searchQuery,
    setSearchQuery,
    selectedTypes,
    setSelectedTypes,
    availableTypes,
    filteredGroups,
    filteredSources,
  } = useSourceFilter(sources, groups);

  return (
    <Box className="previewRoot" h={300} style={{ display: 'flex', flexDirection: 'column' }}>
      <SourceFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        availableTypes={availableTypes}
      />
      <ScrollArea type="always" scrollbars="y" scrollbarSize={3} offsetScrollbars style={{ flex: 1 }}>
        <Stack gap="5">
          {filteredGroups.map((group) => (
            <SourceGroup key={group.id} group={group} isDraggingAny={isDraggingAny} />
          ))}
        </Stack>

        {filteredSources.length > 0 && (
          <Box
            ref={standaloneRef}
            className="standaloneSourcesContainer"
            data-over={isOverStandalone || undefined}
          >
            <Stack gap="5">
              {filteredSources.map((source) => (
                <SourceCard key={source.id} source={source} isDraggingAny={isDraggingAny} />
              ))}
            </Stack>
          </Box>
        )}

        {filteredGroups.length === 0 && filteredSources.length === 0 && (
          <Box className="emptyPreviewState">
            <Text size="xs" c="dimmed">
              No matching sources
            </Text>
          </Box>
        )}
      </ScrollArea>

      <DragOverlay>
        {activeSource ? <SourceCard source={activeSource} isOverlay /> : null}
      </DragOverlay>
    </Box>
  );
};

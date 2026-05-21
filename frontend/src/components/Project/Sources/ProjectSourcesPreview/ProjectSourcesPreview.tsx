import React from 'react';
import { Stack, Box, Text, ScrollArea } from '@mantine/core';
import { DragOverlay, useDroppable } from '@dnd-kit/react';
import { Source, SourceGroup as SourceGroupType } from '../types';
import { SourceGroup } from '../SourceGroup/SourceGroup';
import { SourceCard } from '../SourceCard/SourceCard';
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

  return (
    <Box className="previewRoot">
      <ScrollArea h={300} scrollbars="y" scrollbarSize={3} offsetScrollbars>
        <Stack gap="5">
          {groups.map((group) => (
            <SourceGroup key={group.id} group={group} isDraggingAny={isDraggingAny} />
          ))}
        </Stack>

        {sources.length > 0 && (
          <Box
            ref={standaloneRef}
            className="standaloneSourcesContainer"
            data-over={isOverStandalone || undefined}
          >
            <Stack gap="5">
              {sources.map((source) => (
                <SourceCard key={source.id} source={source} isDraggingAny={isDraggingAny} />
              ))}
            </Stack>
          </Box>
        )}

        {groups.length === 0 && sources.length === 0 && (
          <Box className="emptyPreviewState">
            <Text size="xs" c="dimmed">
              No sources or groups yet
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

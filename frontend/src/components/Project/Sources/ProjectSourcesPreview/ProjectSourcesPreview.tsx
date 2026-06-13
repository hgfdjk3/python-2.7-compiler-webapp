import React, { useState, useMemo } from 'react';
import { Stack, Box, Text, ScrollArea, Center, Loader } from '@mantine/core';
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
    isLoading?: boolean;
    onEditSource?: (id: string) => void;
}

export const ProjectSourcesPreview: React.FC<ProjectSourcesPreviewProps> = ({
    initialGroups,
    standaloneSources,
    activeSourceId,
    isLoading,
    onEditSource,
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
            isLoading={isLoading}
            onEditSource={onEditSource}
        />
    );
};

interface ProjectSourcesPreviewContentProps {
    groups: SourceGroupType[];
    sources: Source[];
    activeSource: Source | null;
    isDraggingAny: boolean;
    isLoading?: boolean;
    onEditSource?: (id: string) => void;
}

const ProjectSourcesPreviewContent: React.FC<ProjectSourcesPreviewContentProps> = ({
    groups,
    sources,
    activeSource,
    isDraggingAny,
    isLoading,
    onEditSource
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
        <Box className="previewRoot" pt="5" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
                        <SourceGroup key={group.id} group={group} isDraggingAny={isDraggingAny} onEditSource={onEditSource} />
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
                                <SourceCard key={source.id} source={source} isDraggingAny={isDraggingAny} onRename={onEditSource ? () => onEditSource(source.id) : undefined} />
                            ))}
                        </Stack>
                    </Box>
                )}

                {isLoading ? (
                    <Center h={100}>
                        <Loader size="sm" type="dots" color="gray" />
                    </Center>
                ) : filteredGroups.length === 0 && filteredSources.length === 0 && (
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

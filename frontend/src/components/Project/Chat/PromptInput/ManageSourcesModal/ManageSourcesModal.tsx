import React from 'react';
import {
  Modal,
  Text,
  Grid,
} from '@mantine/core';
import { useDroppable } from '@dnd-kit/react';
import { Source, SourceGroup as SourceGroupType } from '../../../Sources/types';
import { ProjectSourcesSection } from './ProjectSourcesSection';
import { GlobalSourcesSection } from './GlobalSourcesSection';

import './ManageSourcesModal.css';

export interface ManageSourcesModalProps {
  opened: boolean;
  onClose: () => void;
  standaloneSources: Source[];
  groups: SourceGroupType[];
  globalSources: Source[];
  attachedSourceIds: string[];
  onToggleSource: (sourceId: string) => void;
  onAddGlobalToProject: (sourceIds: string[]) => void;
}

export const ManageSourcesModal: React.FC<ManageSourcesModalProps> = ({
  opened,
  onClose,
  standaloneSources = [],
  groups = [],
  globalSources = [],
  attachedSourceIds = [],
  onToggleSource,
  onAddGlobalToProject,
}) => {
  const { ref: projectSourcesRef, isDropTarget: isOverProjectSources } = useDroppable({
    id: 'project-sources-zone',
  });

  // Derive project source IDs from standalone + grouped sources
  const projectSourceIds = [
    ...standaloneSources.map((s) => s.id),
    ...groups.flatMap((g) => g.sources.map((s) => s.id)),
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title={
        <Text fw={600} size="lg">
          Manage Sources
        </Text>
      }
      size="1000px"
      radius="md"
      classNames={{
        header: 'manageSourcesHeader',
        body: 'manageSourcesBody',
      }}
    >
      <Grid>
        <Grid.Col span={6}>
          <ProjectSourcesSection
            standaloneSources={standaloneSources}
            groups={groups}
            attachedSourceIds={attachedSourceIds}
            onToggleSource={onToggleSource}
            dropRef={projectSourcesRef}
            isOver={isOverProjectSources}
          />
        </Grid.Col>

        <Grid.Col span={6}>
          <GlobalSourcesSection
            globalSources={globalSources}
            projectSourceIds={projectSourceIds}
            onAddToProject={onAddGlobalToProject}
          />
        </Grid.Col>
      </Grid>
    </Modal>
  );
};

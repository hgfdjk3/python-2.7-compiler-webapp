import React from 'react';
import { Box, Loader, Center } from '@mantine/core';
import { motion } from 'motion/react';
import { useParams } from 'react-router-dom';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { ProjectPanel } from '../components/Project/ProjectPanel';
import { useProject } from '../api/projects';

export const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading } = useProject(projectId || '');

  if (isLoading) {
    return (
      <ProjectLayout>
        <Center h="100%">
          <Loader />
        </Center>
      </ProjectLayout>
    );
  }

  if (!project) {
    return (
      <ProjectLayout>
        <Center h="100%">
          <div>Project not found</div>
        </Center>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <motion.div
          key={`project-panel-${project.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.15 } }}
          exit={{ opacity: 0 }}
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <ProjectPanel project={project} />
        </motion.div>
      </Box>
    </ProjectLayout>
  );
};

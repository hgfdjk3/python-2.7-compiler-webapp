import React from 'react';
import { Box, Loader, Center } from '@mantine/core';
import { motion } from 'motion/react';
import { useParams } from 'react-router-dom';
import { ProjectPanel } from '../components/Project/ProjectPanel';
import { useProject } from '../api/projects';
import { EmptyProjectModal } from '../components/Project/EmptyProjectModal/EmptyProjectModal';

export const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading } = useProject(projectId || '');

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }

  if (!project) {
    return (
      <Center h="100%">
        <div>Project not found</div>
      </Center>
    );
  }

  return (
    <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }} pr="xs" >
      <motion.div
        key={`project-panel-${project.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.15 } }}
        exit={{ opacity: 0 }}
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <ProjectPanel project={project} />
        <EmptyProjectModal projectId={project.id} />
      </motion.div>
    </Box>
  );
};

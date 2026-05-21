import React from 'react';
import { Box } from '@mantine/core';
import { motion } from 'motion/react';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { ProjectPanel } from '../components/Project/ProjectPanel';

export const ProjectPage: React.FC = () => {
  return (
    <ProjectLayout>
      <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <motion.div
          key="project-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.15 } }}
          exit={{ opacity: 0 }}
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <ProjectPanel />
        </motion.div>
      </Box>
    </ProjectLayout>
  );
};

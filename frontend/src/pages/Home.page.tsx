import React from 'react';
import { Box } from '@mantine/core';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { ProjectsView } from '../components/Projects/ProjectsView';
import { HomeOverview } from '../components/HomeOverview/HomeOverview';

export const HomePage: React.FC = () => {
  const location = useLocation();
  const isProjectsRoute = location.pathname === '/projects';

  return (
    <ProjectLayout>
      <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {isProjectsRoute ? (
            <ProjectsView key="projects-view" />
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <HomeOverview />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </ProjectLayout>
  );
};

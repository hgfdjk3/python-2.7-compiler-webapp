import React, { useState } from 'react';
import { Container, SimpleGrid, Stack } from '@mantine/core';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ProjectsHeader } from './ProjectsHeader/ProjectsHeader';
import { ProjectCard } from './ProjectCard/ProjectCard';

import { useProjects } from '../../api/projects';

export const ProjectsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--mantine-color-body)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Container size="xl" py="xl" style={{ flex: 1, width: '100%' }}>
        <Stack gap="xl">
          <ProjectsHeader
            onSearchChange={setSearchQuery}
            onSortChange={(val) => console.log('Sort changed:', val)}
            onNewProject={() => navigate('/new_project')}
          />

          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 3 }}
            spacing="lg"
            verticalSpacing="lg"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ProjectCard
                  title={project.name}
                  description={project.chats.length > 0 ? `Contains ${project.chats.length} chats` : 'New Workspace'}
                  updatedAt="Recently"
                  sourcesCount={0}
                  agentsCount={project.automation_ids?.length || 0}
                  onClick={() => navigate(`/project/${project.id}`)}
                />
              </motion.div>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </motion.div>
  );
};

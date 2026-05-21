import React, { useState } from 'react';
import { Container, SimpleGrid, Stack } from '@mantine/core';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ProjectsHeader } from './ProjectsHeader/ProjectsHeader';
import { ProjectCard } from './ProjectCard/ProjectCard';

const MOCK_PROJECTS = [
  {
    id: '1',
    title: 'test',
    description: 'A sandbox project for experimenting with new agent configurations and prompt templates.',
    updatedAt: '2 days ago',
    sourcesCount: 4,
    agentsCount: 2,
  },
  {
    id: '2',
    title: 'ty',
    description: 'if i want to make it run, how to do it? ',
    updatedAt: 'last week',
    sourcesCount: 1,
    agentsCount: 0,
  },
];

export const ProjectsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredProjects = MOCK_PROJECTS.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
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
                  title={project.title}
                  description={project.description}
                  updatedAt={project.updatedAt}
                  sourcesCount={project.sourcesCount}
                  agentsCount={project.agentsCount}
                  onClick={() => navigate(`/project/${encodeURIComponent(project.title)}`)}
                />
              </motion.div>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </motion.div>
  );
};

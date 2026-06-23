import React, { useState } from 'react';
import { Container, SimpleGrid, Stack } from '@mantine/core';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ProjectsHeader } from './ProjectsHeader/ProjectsHeader';
import { ProjectCard } from './ProjectCard/ProjectCard';
import { RenameProjectModal } from './RenameProjectModal/RenameProjectModal';

import { useProjects, useDeleteProject } from '../../api/projects';

export const ProjectsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectToRename, setProjectToRename] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const deleteProject = useDeleteProject();

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <RenameProjectModal
        opened={!!projectToRename}
        onClose={() => setProjectToRename(null)}
        projectToRename={projectToRename}
      />

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
                    onRename={() => {
                      setProjectToRename({ id: project.id, name: project.name });
                    }}
                    onDelete={() => {
                      if (window.confirm('Are you sure you want to delete this project?')) {
                        deleteProject.mutate(project.id);
                      }
                    }}
                  />
                </motion.div>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </motion.div>
    </>
  );
};

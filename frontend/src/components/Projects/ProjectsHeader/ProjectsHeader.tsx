import React from 'react';
import { Group, Title, Button, Select, TextInput, Stack } from '@mantine/core';
import { IconSearch, IconChevronDown, IconPlus } from '@tabler/icons-react';
import './ProjectsHeader.css';

interface ProjectsHeaderProps {
  onSearchChange: (value: string) => void;
  onSortChange: (value: string | null) => void;
  onNewProject: () => void;
}

export const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({
  onSearchChange,
  onSortChange,
  onNewProject,
}) => {
  return (
    <Stack gap="xl" className="projects-header-container">
      <Group justify="space-between" align="center">
        <Title order={1} className="projects-title">Projects</Title>
        <Group gap="md">
          <Group gap="xs">
            <span className="sort-label">Sort by</span>
            <Select
              defaultValue="Activity"
              data={['Activity', 'Name', 'Date created']}
              rightSection={<IconChevronDown size={16} />}
              className="sort-select"
              onChange={onSortChange}
              size="sm"
            />
          </Group>
          <Button
            leftSection={<IconPlus size={18} />}
            className="new-project-button"
            onClick={onNewProject}
            radius="md"
            size="sm"
          >
            New project
          </Button>
        </Group>
      </Group>

      <TextInput
        placeholder="Search projects..."
        leftSection={<IconSearch size={18} />}
        size="lg"
        radius="md"
        className="projects-search"
        onChange={(e) => onSearchChange(e.currentTarget.value)}
      />
    </Stack>
  );
};

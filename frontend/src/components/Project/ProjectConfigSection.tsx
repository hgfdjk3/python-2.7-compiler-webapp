import React, { forwardRef } from 'react';
import { ActionIcon, Card, Group, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

interface ProjectConfigSectionProps {
  title: string;
  onAdd?: () => void;
  children: React.ReactNode;
  flex?: number | string;
}

export const ProjectConfigSection = forwardRef<HTMLDivElement, ProjectConfigSectionProps>(
  ({ title, onAdd, children, flex }, ref) => {
    return (
      <Card withBorder p="md" py="sm" radius="md" style={{ flex }} ref={ref}>
        <Group justify="space-between" mb="5">
          <Text size="sm" fw={600}>
            {title}
          </Text>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={onAdd}>
            <IconPlus size={16} stroke={1.5} />
          </ActionIcon>
        </Group>
        {children}
      </Card>
    );
  }
);

ProjectConfigSection.displayName = 'ProjectConfigSection';

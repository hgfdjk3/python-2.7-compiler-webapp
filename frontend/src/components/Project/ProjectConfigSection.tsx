import React, { forwardRef } from 'react';
import { ActionIcon, Card, Group, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

interface ProjectConfigSectionProps {
  title: string;
  onAdd?: () => void;
  rightSection?: React.ReactNode;
  children: React.ReactNode;
  flex?: number | string;
}

export const ProjectConfigSection = forwardRef<HTMLDivElement, ProjectConfigSectionProps>(
  ({ title, onAdd, rightSection, children, flex }, ref) => {
    return (
      <Card withBorder p="md" py="sm" radius="md" style={{ flex, display: 'flex', flexDirection: 'column', minHeight: 0 }} ref={ref}>
        <Group justify="space-between" mb="5">
          <Text size="sm" fw={600}>
            {title}
          </Text>
          <Group gap="xs">
            {rightSection}
            {onAdd && (
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={onAdd}>
                <IconPlus size={16} stroke={1.5} />
              </ActionIcon>
            )}
          </Group>
        </Group>
        {children}
      </Card>
    );
  }
);

ProjectConfigSection.displayName = 'ProjectConfigSection';

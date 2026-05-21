import React from 'react';
import { Spoiler, Text } from '@mantine/core';

interface ProjectOverviewProps {
  content: string;
  maxHeight?: number;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ content, maxHeight = 50 }) => {
  return (
    <Spoiler
      maxHeight={maxHeight}
      showLabel="Show more"
      hideLabel="Hide"
      styles={{
        control: {
          fontSize: 'var(--mantine-font-size-xs)',
          fontWeight: 500,
          display: 'inline',
        }
      }}
    >
      <Text size="xs" c="dimmed" style={{ lineHeight: 1.5 }}>
        {content}
      </Text>
    </Spoiler>
  );
};

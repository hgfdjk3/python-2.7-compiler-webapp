import React from 'react';
import { Group, Text, Button, SimpleGrid, ThemeIcon } from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { IconTool } from '@tabler/icons-react';
import '@mantine/carousel/styles.css';

interface AgentToolsListProps {
  tools: string[];
  brandColor: string;
}

export const AgentToolsList: React.FC<AgentToolsListProps> = ({ tools, brandColor }) => {
  return (
    <div className="agent-tools-list-container">
      <Group justify="space-between" align="center" mb="xs">
        <Group gap={6}>
          <Text fw={700} lh={1} size="md">
            Enabled Tools
          </Text>
          <Text
            size="10px"
            fw={800}
            px={6}
            py={1}
            style={{
              borderRadius: 10,
              backgroundColor: 'light-dark(var(--mantine-color-zinc-2), var(--mantine-color-zinc-8))',
              color: 'light-dark(var(--mantine-color-zinc-8), var(--mantine-color-zinc-3))'
            }}
          >
            {tools.length}
          </Text>
        </Group>
      </Group>

      {tools.length > 0 ? (
        <Carousel
          withControls={tools.length > 2}
          slideSize="50%"
          slideGap="xs"
          styles={{
            control: {
              backgroundColor: 'light-dark(var(--mantine-color-zinc-2), var(--mantine-color-zinc-8))',
              borderColor: 'light-dark(var(--mantine-color-zinc-3), var(--mantine-color-zinc-7))',
              color: 'light-dark(var(--mantine-color-zinc-8), var(--mantine-color-white))',
              opacity: 0.8,
              '&:hover': {
                backgroundColor: 'light-dark(var(--mantine-color-zinc-3), var(--mantine-color-zinc-7))',
                opacity: 1,
              }
            }
          }}
        >
          {tools.map((tool) => (
            <Carousel.Slide key={tool}>
              <Group
                gap="xs"
                wrap="nowrap"
                p={6}
                style={{
                  background: 'light-dark(var(--mantine-color-zinc-0), var(--mantine-color-zinc-9))',
                  border: '1px solid light-dark(var(--mantine-color-zinc-2), var(--mantine-color-zinc-8))',
                  borderRadius: 'var(--mantine-radius-md)'
                }}
              >
                <ThemeIcon variant="light" size="sm" color={brandColor}>
                  <IconTool size={12} />
                </ThemeIcon>
                <Text size="xs" fw={600} truncate title={tool}>
                  {tool}
                </Text>
              </Group>
            </Carousel.Slide>
          ))}
        </Carousel>
      ) : (
        <Text size="xs" c="zinc.5" fs="italic">No tools exposed by this connection.</Text>
      )}
    </div>
  );
};

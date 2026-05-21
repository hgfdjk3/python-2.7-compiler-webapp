import React from 'react';
import { Card, Text, Group, Box, ThemeIcon, Stack, Tooltip } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { AgentInfo } from '../../utils/agentUtils';
import './AgentCard.css';

interface AgentCardProps {
  agent: AgentInfo;
  status: 'enabled' | 'disabled';
  onClick: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  status,
  onClick
}) => {
  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      p="sm"
      onClick={onClick}
      className="agent-card"
      style={{ '--agent-brand-color': agent.brandColor } as React.CSSProperties}
    >
      <Group wrap="nowrap" align="flex-start">
        <Box style={{ position: 'relative' }}>
          <ThemeIcon
            size={42}
            radius="md"
            variant="light"
            color="gray"
            className="agent-icon-wrapper"
          >
            {agent.icon}
          </ThemeIcon>
        </Box>
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Text fw={600} size="sm" c="zinc.1" truncate>{agent.name}</Text>
            {status === 'enabled' && (
              <ThemeIcon variant='light' size="sm" className="status-indicator-glass">
                <IconCheck size={12} />
              </ThemeIcon>
            )}
          </Group>
          <Text size="xs" c="zinc.4" lineClamp={2} style={{ transition: 'color 0.3s ease' }} className="agent-desc">{agent.description}</Text>
        </Stack>
      </Group>


    </Card>
  );
};

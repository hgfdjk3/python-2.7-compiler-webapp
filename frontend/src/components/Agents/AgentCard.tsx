import React from 'react';
import { Card, Text, Group, Box, ThemeIcon, Stack, Tooltip } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { AgentInfo } from '../../utils/agentUtils';
import { getAgentIcon } from '../../utils/iconUtils';
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
      shadow="md"
      radius="sm"
      p="md"
      onClick={onClick}
      className="agent-card"
      style={{ '--agent-brand-color': agent.brandColor } as React.CSSProperties}
    >
      <Group wrap="nowrap" align="center" gap="md">
        <Box style={{ position: 'relative' }}>
          <ThemeIcon
            size={56}
            radius="lg"
            variant="light"
            color="gray"
            className="agent-icon-wrapper"
          >
            {getAgentIcon(agent.iconName || agent.name, { size: 30, stroke: 1.5 })}
          </ThemeIcon>
        </Box>
        <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Text fw={700} size="md" truncate>{agent.name}</Text>
            {status === 'enabled' && (
              <ThemeIcon variant='light' size="sm" className="status-indicator-glass">
                <IconCheck size={12} />
              </ThemeIcon>
            )}
          </Group>
          <Text size="xs" c="zinc.4" lineClamp={2} style={{ transition: 'color 0.3s ease', lineHeight: 1.4 }} className="agent-desc">{agent.description}</Text>
        </Stack>
      </Group>


    </Card>
  );
};

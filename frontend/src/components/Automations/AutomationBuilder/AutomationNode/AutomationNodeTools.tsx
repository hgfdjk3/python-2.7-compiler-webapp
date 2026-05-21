import React from 'react';
import { Group, Text, ThemeIcon, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { getToolInfo } from '../../../../utils/agentUtils';

export interface AutomationNodeToolsProps {
  tools: string[];
  expanded: boolean;
  onToggle: () => void;
}

export const AutomationNodeTools: React.FC<AutomationNodeToolsProps> = ({ 
  tools, 
  expanded, 
  onToggle 
}) => {
  if (!tools || tools.length === 0) return null;

  // Group tools by agent color
  const summary = tools.reduce((acc, toolIdOrName) => {
    const info = getToolInfo(toolIdOrName);
    const key = info.color;

    if (!acc[key]) {
      acc[key] = {
        color: info.color,
        icon: info.icon,
        count: 0
      };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { color: string; icon: React.ReactNode; count: number }>);

  const summaryItems = Object.values(summary);

  return (
    <Group justify="space-between" align="center" mt="xs">
      <Group gap={8}>
        <Text size="xs" c="dimmed">Tools:</Text>
        <Group gap={8} wrap="nowrap">
          {summaryItems.map((item, index) => (
            <Group key={index} gap="3px" wrap="nowrap">
              <Text size="xs" c="dimmed" fw={600}>
                {item.count}
              </Text>
              <ThemeIcon
                variant="outline"
                size="xs"
                radius="xs"
                bg="body.2"
                style={{
                  border: `1px solid ${item.color}`,
                  color: item.color,
                  width: '16px',
                  height: '16px',
                  minWidth: '16px',
                  minHeight: '16px'
                }}
              >
                {item.icon}
              </ThemeIcon>
            </Group>
          ))}
        </Group>
      </Group>

      <ActionIcon
        variant="transparent"
        size="sm"
        className="nodrag"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        c="dimmed"
      >
        {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
      </ActionIcon>
    </Group>
  );
};


import React from 'react';
import { Box, Group, Text } from '@mantine/core';
import { IconBolt, IconActivity } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { AutomationActionButton } from './AutomationActionButton';
import './Automations.css';

export interface AutomationData {
  id: string;
  name: string;
  description: string;
  isScheduled: boolean;
  schedule?: string;
  isActive: boolean;
  lastRun?: string;
  isRunning?: boolean;
}

interface AutomationItemProps {
  automation: AutomationData;
  onToggleActive?: (id: string) => void;
  onRun?: (id: string) => void;
  onClick?: (id: string) => void;
  onScheduleClick?: (id: string) => void;
}

export const AutomationItem: React.FC<AutomationItemProps> = ({ automation, onToggleActive, onRun, onClick, onScheduleClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      style={{ width: '100%' }}
    >
      <Box
        className={`automation-row ${automation.isActive ? 'is-active' : ''}`}
        onClick={() => onClick?.(automation.id)}
      >
        <Group justify="space-between" align="center" wrap="nowrap" style={{ width: '100%' }}>
          <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Text size="sm" fw={500} truncate c={automation.isActive || !automation.isScheduled ? undefined : "dimmed"}>
              {automation.name}
            </Text>

            <Text size="xs" c="dimmed" truncate>
              {automation.description}
              {automation.lastRun && ` • Last run: ${automation.lastRun}`}
            </Text>
          </Box>

          <Group gap="md" align="center" wrap="nowrap" className="automation-actions" onClick={(e) => e.stopPropagation()}>
            <AutomationActionButton 
              isScheduled={automation.isScheduled}
              isActive={automation.isActive}
              isRunning={automation.isRunning}
              schedule={automation.schedule}
              onToggle={() => onToggleActive?.(automation.id)}
              onRun={() => onRun?.(automation.id)}
              onScheduleClick={() => onScheduleClick?.(automation.id)}
            />
          </Group>
        </Group>
      </Box>
    </motion.div>
  );
};

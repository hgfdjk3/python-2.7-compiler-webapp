import React from 'react';
import { Box, Text, Title, Group, Badge } from '@mantine/core';
import { IconBook2, IconPlugConnected } from '@tabler/icons-react';
import { motion } from 'motion/react';
import './DevPageHeader.css';

export type DevTab = 'documentation' | 'connections';

interface DevPageHeaderProps {
  activeTab: DevTab;
  onTabChange: (tab: DevTab) => void;
}

const tabs: { id: DevTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'documentation', label: 'Documentation', icon: <IconBook2 size={16} stroke={1.5} /> },
  {
    id: 'connections',
    label: 'Agent Connections',
    icon: <IconPlugConnected size={16} stroke={1.5} />,
    badge: '1',
  },
];

export const DevPageHeader: React.FC<DevPageHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <motion.div
      className="dev-page-header"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Box mb="xl">
        <Group gap="xs" mb={6}>
          <Badge variant="dot" color="violet" size="sm">
            Developer Hub
          </Badge>
        </Group>
        <Title order={1} fw={800} className="dev-page-title">
          Build &amp; Connect
        </Title>
        <Text c="dimmed" size="md" mt={6}>
          Manage your agent integrations and explore the API to supercharge your workspace.
        </Text>
      </Box>

      <Group gap={4} className="dev-tabs">
        {tabs.map((tab) => (
          <Box
            key={tab.id}
            className={`dev-tab ${activeTab === tab.id ? 'dev-tab--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {activeTab === tab.id && (
              <motion.div
                className="dev-tab-pill"
                layoutId="dev-tab-active"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <Group gap={6} style={{ position: 'relative', zIndex: 1 }}>
              {tab.icon}
              <Text size="sm" fw={600}>
                {tab.label}
              </Text>
              {tab.badge && (
                <Badge size="xs" variant="filled" color="violet" circle>
                  {tab.badge}
                </Badge>
              )}
            </Group>
          </Box>
        ))}
      </Group>
    </motion.div>
  );
};

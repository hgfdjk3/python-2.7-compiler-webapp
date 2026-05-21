import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Group, Stack } from '@mantine/core';
import { IconBook2, IconPlugConnected, IconArrowRight } from '@tabler/icons-react';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { motion } from 'motion/react';
import './Developers.css';

interface HubOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  to: string;
  delay?: number;
}

const HubOption: React.FC<HubOptionProps> = ({ icon, label, description, to, delay = 0 }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      className="hub-option"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      onClick={() => navigate(to)}
      whileHover={{ x: 4 }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="lg" wrap="nowrap">
          <Box className="hub-option-icon">{icon}</Box>
          <Stack gap={2}>
            <Text fw={700} size="md">
              {label}
            </Text>
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          </Stack>
        </Group>
        <IconArrowRight size={18} stroke={1.5} className="hub-option-arrow" />
      </Group>
    </motion.div>
  );
};

export const DevelopersPage: React.FC = () => {
  return (
    <ProjectLayout>
      <Box className="dev-hub-root">
        <Box className="dev-hub-content">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs" style={{ letterSpacing: '0.8px' }}>
              Developer Hub
            </Text>
            <Text fw={800} size="xl" mb={6} style={{ letterSpacing: '-0.5px' }}>
              What are you building?
            </Text>
            <Text c="dimmed" size="sm" mb={40}>
              Explore the API or manage your connected agents.
            </Text>
          </motion.div>

          <Stack gap="xs">
            <HubOption
              icon={<IconBook2 size={22} stroke={1.5} />}
              label="Documentation"
              description="Quickstart guides, API reference, SDKs and webhook setup"
              to="/developers/docs"
              delay={0.05}
            />
            <HubOption
              icon={<IconPlugConnected size={22} stroke={1.5} />}
              label="Agent Connections"
              description="Manage active integrations, API tokens and usage analytics"
              to="/developers/connections"
              delay={0.1}
            />
          </Stack>
        </Box>
      </Box>
    </ProjectLayout>
  );
};

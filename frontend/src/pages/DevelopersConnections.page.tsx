import React from 'react';
import { Box, Text, Group, Anchor, Stack } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { DevSubHeader } from '../components/Developers/DevSubHeader/DevSubHeader';
import { AgentRow } from '../components/Developers/AgentRow/AgentRow';
import { AGENTS_DIRECTORY } from '../utils/agentUtils';
import { motion } from 'motion/react';
import './DevelopersConnections.css';

const ENABLED_AGENTS = new Set(['github']);

export const DevelopersConnectionsPage: React.FC = () => {
  const active = AGENTS_DIRECTORY.filter((a) => ENABLED_AGENTS.has(a.id));
  const inactive = AGENTS_DIRECTORY.filter((a) => !ENABLED_AGENTS.has(a.id));

  return (
    <ProjectLayout>
      <Box className="dev-sub-root">
        <Box className="dev-sub-content">
          <DevSubHeader title="Agent Connections" backTo="/developers" />

          {/* Active */}
          {active.length > 0 && (
            <Box mb={40}>
              <Group justify="space-between" mb="md">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.6px' }}>
                  Active · {active.length}
                </Text>
              </Group>
              {active.map((agent, i) => (
                <AgentRow key={agent.id} agent={agent} status="enabled" delay={i * 0.04} />
              ))}
            </Box>
          )}

          {/* Inactive */}
          {inactive.length > 0 && (
            <Box>
              <Group justify="space-between" mb="md">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.6px', opacity: 0.6 }}>
                  Inactive · {inactive.length}
                </Text>
                <Anchor
                  size="xs"
                  c="dimmed"
                  href="/agents"
                  style={{ textDecoration: 'none' }}
                >
                  <Group gap={4}>
                    Browse marketplace
                    <IconArrowRight size={12} />
                  </Group>
                </Anchor>
              </Group>
              <Box style={{ opacity: 0.5 }}>
                {inactive.map((agent, i) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    status="disabled"
                    delay={active.length * 0.04 + i * 0.03}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </ProjectLayout>
  );
};

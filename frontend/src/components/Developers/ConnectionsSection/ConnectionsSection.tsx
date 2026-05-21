import React from 'react';
import { Box, Text, Group, Stack, ThemeIcon, Anchor, SimpleGrid } from '@mantine/core';
import { IconPlugConnected, IconArrowRight } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { AgentConnectionCard } from '../AgentConnectionCard/AgentConnectionCard';
import { AGENTS_DIRECTORY } from '../../../utils/agentUtils';

const ENABLED_AGENTS = new Set(['github']);

export const ConnectionsSection: React.FC = () => {
  const activeAgents = AGENTS_DIRECTORY.filter((a) => ENABLED_AGENTS.has(a.id));
  const inactiveAgents = AGENTS_DIRECTORY.filter((a) => !ENABLED_AGENTS.has(a.id));

  return (
    <Box>
      {/* Global summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Group
          className="connections-summary"
          justify="space-between"
          mb="xl"
          p="lg"
          style={{
            borderRadius: 'var(--mantine-radius-lg)',
            border: '1px solid var(--mantine-color-default-border)',
            background: 'var(--mantine-color-body)',
          }}
        >
          <Group gap="md">
            <ThemeIcon size={44} radius="md" variant="light" color="violet">
              <IconPlugConnected size={22} stroke={1.5} />
            </ThemeIcon>
            <Stack gap={2}>
              <Text fw={700} size="md">
                Agent Connections
              </Text>
              <Text size="xs" c="dimmed">
                {activeAgents.length} active · {inactiveAgents.length} available in marketplace
              </Text>
            </Stack>
          </Group>
          <Anchor
            size="xs"
            c="violet.4"
            fw={600}
            href="/agents"
            style={{ textDecoration: 'none' }}
          >
            <Group gap={4}>
              Browse marketplace
              <IconArrowRight size={13} />
            </Group>
          </Anchor>
        </Group>
      </motion.div>

      {/* Active connections */}
      {activeAgents.length > 0 && (
        <Box mb="xl">
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="dimmed"
            mb="md"
            style={{ letterSpacing: '0.5px' }}
          >
            Active ({activeAgents.length})
          </Text>
          <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
            {activeAgents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <AgentConnectionCard agent={agent} status="enabled" />
              </motion.div>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Inactive connections */}
      {inactiveAgents.length > 0 && (
        <Box>
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="dimmed"
            mb="md"
            style={{ letterSpacing: '0.5px', opacity: 0.7 }}
          >
            Inactive ({inactiveAgents.length})
          </Text>
          <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
            {inactiveAgents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: activeAgents.length * 0.05 + i * 0.04 }}
                style={{ opacity: 0.65 }}
              >
                <AgentConnectionCard agent={agent} status="disabled" />
              </motion.div>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
};

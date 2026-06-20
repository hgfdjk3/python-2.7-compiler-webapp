import React, { useState, useMemo } from 'react';
import { Box, Title, Stack, SimpleGrid, Divider, Group, Anchor, TextInput, SegmentedControl, Text } from '@mantine/core';
import { AnimatePresence, motion } from 'motion/react';
import { IconSearch } from '@tabler/icons-react';
import { AgentCard } from './AgentCard';
import { AgentModal } from './AgentModal';
import { useAgentInfo, AgentInfo } from '../../utils/agentUtils';
import { useConnectors } from '../../api/connectors';
import { useUserConfig, useUpdateUserConfig } from '../../api/user';

export const AgentMarketplace: React.FC = () => {
  const { agents } = useAgentInfo();
  const { data: dynamicConnectors = [] } = useConnectors();
  const { data: userConfig, isLoading: isConfigLoading } = useUserConfig();
  const updateUserConfigMutation = useUpdateUserConfig();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const agentStatuses = React.useMemo(() => {
    const statuses: Record<string, 'enabled' | 'disabled'> = {};
    if (userConfig?.enabled_connectors) {
      agents.forEach(a => {
        statuses[a.id] = userConfig.enabled_connectors.includes(a.id) ? 'enabled' : 'disabled';
      });
    }
    return statuses;
  }, [userConfig, agents]);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const tagSet = new Set<string>();
    let hasUncategorized = false;
    agents.forEach(a => {
      if (a.tags && a.tags.length > 0) {
        a.tags.forEach(t => tagSet.add(t));
      } else {
        hasUncategorized = true;
      }
    });
    const sortedTags = Array.from(tagSet).sort();
    if (hasUncategorized) {
      sortedTags.push('Uncategorized');
    }
    return sortedTags;
  }, [agents]);

  const displayedCategories = activeFilter === 'All'
    ? categories
    : [activeFilter];

  const handleToggleStatus = async (id: string) => {
    if (!userConfig) return;
    const isEnabled = agentStatuses[id] === 'enabled';
    const newEnabled = isEnabled
      ? userConfig.enabled_connectors.filter(c => c !== id)
      : [...userConfig.enabled_connectors, id];

    await updateUserConfigMutation.mutateAsync({
      enabled_connectors: newEnabled,
      header_values: userConfig.header_values || {},
    });
  };

  const handleUpdateConfig = async (id: string, header_values: Record<string, string>) => {
    if (!userConfig) return;

    const newHeaders = { ...userConfig.header_values, [id]: header_values };
    const newEnabled = userConfig.enabled_connectors.includes(id)
      ? userConfig.enabled_connectors
      : [...userConfig.enabled_connectors, id];

    await updateUserConfigMutation.mutateAsync({
      enabled_connectors: newEnabled,
      header_values: newHeaders,
    });
  };

  const selectedAgent = React.useMemo(() => {
    if (!selectedAgentId) return null;
    const agent = agents.find(a => a.id === selectedAgentId);
    if (!agent) return null;
    return {
      ...agent,
      header_values: userConfig?.header_values?.[selectedAgentId] || {},
    };
  }, [selectedAgentId, agents, userConfig]);

  return (
    <Box>
      <Stack gap="xl" mb="2xl">
        <Group justify="space-between" align="flex-start">

          <TextInput
            placeholder="Search connectors..."
            leftSection={<IconSearch size={16} stroke={1.5} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            radius="md"
            size="md"
            w={{ base: '100%', sm: 280 }}
            styles={{
              input: {
                backgroundColor: 'var(--mantine-color-zinc-9)',
                borderColor: 'var(--mantine-color-zinc-8)',
                '&:focus': { borderColor: 'var(--mantine-color-zinc-6)' }
              }
            }}
          />

          <Group gap="xs" style={{ flexWrap: 'wrap' }}>
            {['All', ...categories].map((category) => {
              const isActive = activeFilter === category;
              return (
                <Box
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  style={{
                    position: 'relative',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    borderRadius: 'var(--mantine-radius-md)',
                    transition: 'color 0.2s ease',
                    color: isActive ? 'var(--mantine-color-white)' : 'var(--mantine-color-zinc-5)',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'var(--mantine-color-zinc-8)',
                        borderRadius: 'var(--mantine-radius-md)',
                        zIndex: 0,
                        border: '1px solid var(--mantine-color-zinc-7)',
                      }}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <Text size="sm" fw={600} style={{ position: 'relative', zIndex: 1, textTransform: 'capitalize' }}>
                    {category}
                  </Text>
                </Box>
              );
            })}
          </Group>
        </Group>
      </Stack>

      <Stack gap="3xl">
        {displayedCategories.map(category => {
          const categoryAgents = agents.filter(a => {
            const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              a.description.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (!matchesSearch) return false;

            if (category === 'Uncategorized') {
              return !a.tags || a.tags.length === 0;
            }
            return a.tags && a.tags.includes(category);
          });

          if (categoryAgents.length === 0) return null;

          return (
            <Stack key={category} gap="md">
              <Box style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--mantine-radius-md)' }}>
                <Box
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, var(--mantine-color-zinc-8) 0%, transparent 100%)',
                    opacity: 0.3,
                    zIndex: 0
                  }}
                />
                <Group justify="space-between" align="center" style={{ position: 'relative', zIndex: 1 }} py="xs" px="md">
                  <Group gap="sm">
                    <Title order={4} size={20} fw={700} style={{ letterSpacing: '-0.5px', textTransform: 'capitalize' }}>
                      {category}
                    </Title>
                    <Box
                      px={8}
                      py={2}
                      style={{
                        background: 'var(--mantine-color-zinc-8)',
                        border: '1px solid var(--mantine-color-zinc-7)',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--mantine-color-zinc-4)'
                      }}
                    >
                      {categoryAgents.length}
                    </Box>
                  </Group>
                </Group>
              </Box>
              <Box p="xs">
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
                  <AnimatePresence initial={false}>
                    {categoryAgents.map(agent => (
                      <motion.div
                        key={`${category}-${agent.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AgentCard
                          agent={agent}
                          status={agentStatuses[agent.id] || 'disabled'}
                          onClick={() => setSelectedAgentId(agent.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </SimpleGrid>
              </Box>
            </Stack>
          );
        })}
      </Stack>

      <AgentModal
        agent={selectedAgent}
        status={selectedAgent ? (agentStatuses[selectedAgent.id] || 'disabled') : 'disabled'}
        opened={!!selectedAgent}
        onClose={() => setSelectedAgentId(null)}
        onToggleStatus={handleToggleStatus}
        onUpdateConfig={handleUpdateConfig}
      />
    </Box>
  );
};

import React, { useState, useMemo } from 'react';
import { Box, Title, Stack, SimpleGrid, Divider, Group, Anchor, TextInput, SegmentedControl, Text } from '@mantine/core';
import { AnimatePresence, motion } from 'motion/react';
import { IconSearch } from '@tabler/icons-react';
import { AgentCard } from './AgentCard';
import { AgentModal } from './AgentModal';
import { useAgentInfo, AgentInfo } from '../../utils/agentUtils';

export const AgentMarketplace: React.FC = () => {
  const { agents } = useAgentInfo();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Track status separately from the agent metadata
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'enabled' | 'disabled'>>({
    github: 'enabled',
    gitlab: 'disabled',
    jira: 'disabled',
    slack: 'disabled',
    discord: 'disabled',
    notion: 'disabled',
    gdrive: 'disabled',
    trello: 'disabled',
    figma: 'disabled'
  });

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const MAX_VISIBLE_AGENTS = 4;

  const categories = useMemo(() => Array.from(new Set(agents.map(a => a.category))), [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeFilter === 'All' || agent.category === activeFilter;
      return matchesSearch && matchesCategory;
    });
  }, [agents, searchQuery, activeFilter]);

  const displayedCategories = activeFilter === 'All'
    ? categories
    : [activeFilter];

  const handleToggleStatus = (id: string) => {
    setAgentStatuses(prev => ({
      ...prev,
      [id]: prev[id] === 'enabled' ? 'disabled' : 'enabled'
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const selectedAgent = selectedAgentId ? agents.find(a => a.id === selectedAgentId) || null : null;

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

          <Group gap="xs">
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
                  <Text size="sm" fw={600} style={{ position: 'relative', zIndex: 1 }}>
                    {category}
                  </Text>
                </Box>
              );
            })}
          </Group>
        </Group>
      </Stack>

      <Stack gap="xl">
        {displayedCategories.map(category => {
          const categoryAgents = filteredAgents.filter(a => a.category === category);
          if (categoryAgents.length === 0) return null;

          const isExpanded = expandedCategories[category];
          const showSeeAll = categoryAgents.length > MAX_VISIBLE_AGENTS;
          const visibleAgents = isExpanded ? categoryAgents : categoryAgents.slice(0, MAX_VISIBLE_AGENTS);

          return (
            <Stack key={category} gap="xs">
              <Group justify='space-between'>
                <Title order={5} size={18} fw={600}>
                  {category}
                </Title>
                {showSeeAll && (
                  <Anchor
                    size='sm'
                    fw={500}
                    onClick={() => toggleCategory(category)}
                    c="zinc.4"
                  >
                    {isExpanded ? 'See Less' : 'See All'}
                  </Anchor>
                )}
              </Group>
              <Divider color="zinc.8" />
              <Box p="xs">
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                  <AnimatePresence initial={false}>
                    {visibleAgents.map(agent => (
                      <motion.div
                        key={agent.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{ padding: 4 }}
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
      />
    </Box>
  );
};

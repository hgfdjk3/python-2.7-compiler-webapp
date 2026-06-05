import React, { useState, useMemo } from 'react';
import { Stack, Group, Title, Text, ScrollArea, Box, ThemeIcon, ActionIcon, TextInput, UnstyledButton } from '@mantine/core';
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { getToolInfo, AgentInfo } from '@/utils/agentUtils';
import { getAgentIcon } from '@/utils/iconUtils';
import { ToolItem } from './ToolItem';
import { motion, AnimatePresence } from 'motion/react';

export interface AvailableToolsSectionProps {
  draftTools: string[];
  agents: AgentInfo[];
  onAddTool: (tool: string) => void;
}

export const AvailableToolsSection: React.FC<AvailableToolsSectionProps> = ({ draftTools, agents, onAddTool }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAgentId, setActiveAgentId] = useState<string | 'all'>('all');

  const availableTools = useMemo(() => {
    const allTools = Array.from(new Set(agents.flatMap(a => a.toolsEnabled || [])));
    return allTools.filter(t => !draftTools.includes(t));
  }, [agents, draftTools]);

  const filteredAvailableTools = useMemo(() => {
    return availableTools.filter(tool => {
      const toolInfo = getToolInfo(tool, agents);

      const matchesSearch = toolInfo.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAgent = activeAgentId === 'all' || toolInfo.agentId === activeAgentId;

      return matchesSearch && matchesAgent;
    });
  }, [availableTools, agents, searchQuery, activeAgentId]);

  return (
    <Stack gap="xs" h="100%">
      <Group justify="space-between" align="center">
        <Title order={5}>Available Tools</Title>
        <Text size="xs" c="dimmed">{availableTools.length} tools</Text>
      </Group>

      <TextInput
        placeholder="Search available tools..."
        leftSection={<IconSearch size={16} />}
        rightSection={
          searchQuery && (
            <ActionIcon variant="subtle" color="gray" onClick={() => setSearchQuery('')}>
              <IconX size={14} />
            </ActionIcon>
          )
        }
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        data-autofocus
      />

      <Group gap="xs" style={{ overflowX: 'auto', flexWrap: 'nowrap' }} pb={4}>
        <UnstyledButton
          className={`typeFilterButton ${activeAgentId === 'all' ? 'active' : ''}`}
          onClick={() => setActiveAgentId('all')}
        >
          <Group gap={6} wrap="nowrap">
            <Text size="sm" fw={500}>All</Text>
          </Group>
        </UnstyledButton>
        {agents.map(agent => (
          <UnstyledButton
            key={agent.id}
            className={`typeFilterButton ${activeAgentId === agent.id ? 'active' : ''}`}
            onClick={() => setActiveAgentId(agent.id)}
          >
            <Group gap={6} wrap="nowrap">
              <ThemeIcon variant="transparent" size="sm" color="currentColor">
                {getAgentIcon(agent.iconName || agent.name, { size: 16 })}
              </ThemeIcon>
              <Text size="sm" fw={500} truncate maw={120}>
                {agent.name}
              </Text>
            </Group>
          </UnstyledButton>
        ))}
      </Group>

      <ScrollArea h={320} type="always" scrollbarSize={3} scrollbars="y">
        {filteredAvailableTools.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl" size="sm">
            No tools found.
          </Text>
        ) : (
          <Stack gap="xs" >
            <AnimatePresence mode="popLayout">
              {filteredAvailableTools.map(tool => {
                const toolInfo = getToolInfo(tool, agents);
                return (
                  <motion.div
                    key={tool}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ToolItem
                      toolInfo={toolInfo}
                      actionIcon={<IconPlus size={16} />}
                      onAction={() => onAddTool(tool)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Stack>
        )}
      </ScrollArea>
    </Stack>
  );
};

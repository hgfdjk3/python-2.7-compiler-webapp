import React, { useState, useMemo } from 'react';
import { Stack, Group, Title, Text, Divider, ScrollArea, Box, ThemeIcon, ActionIcon, TextInput } from '@mantine/core';
import { IconMinus, IconSearch, IconX } from '@tabler/icons-react';
import { getToolInfo, AgentInfo } from "@/utils/agentUtils";
import { ToolItem } from './ToolItem';
import { motion, AnimatePresence } from 'motion/react';

export interface NodeToolsSectionProps {
  draftTools: string[];
  agents: AgentInfo[];
  onRemoveTool: (tool: string) => void;
}

export const NodeToolsSection: React.FC<NodeToolsSectionProps> = ({ draftTools, agents, onRemoveTool }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    if (!searchQuery) return draftTools;
    return draftTools.filter(tool => {
      const toolInfo = getToolInfo(tool, agents);
      return toolInfo.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [draftTools, agents, searchQuery]);

  return (
    <Stack gap="xs" h="100%">
      <Group justify="space-between" align="center">
        <Title order={5}>Node Tools</Title>
        <Text size="xs" c="dimmed">{draftTools.length} tools</Text>
      </Group>

      <TextInput
        placeholder="Search node tools..."
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

      <ScrollArea h={400} type="always" scrollbarSize={3} scrollbars="y">
        {filteredTools.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl" size="sm">
            {draftTools.length === 0 ? "No tools added to this node." : "No tools match your search."}
          </Text>
        ) : (
          <Stack gap="xs">
            <AnimatePresence mode="popLayout">
              {filteredTools.map(tool => {
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
                      actionIcon={<IconMinus size={16} />}
                      onAction={() => onRemoveTool(tool)}
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

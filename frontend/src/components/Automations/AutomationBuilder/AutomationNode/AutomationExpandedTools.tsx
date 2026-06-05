import React, { useState } from 'react';
import { Group, Paper, Flex, ThemeIcon, Text, Box, ActionIcon, Select, Button } from '@mantine/core';
import { IconTool, IconChevronLeft, IconChevronRight, IconX, IconPlus } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'motion/react';
import { getToolInfo, useAgentInfo } from '../../../../utils/agentUtils';
import { ManageToolsModal } from './ManageToolsModal/ManageToolsModal';
import './AutomationNode.css';

export interface AutomationExpandedToolsProps {
  tools: string[];
  isEditing?: boolean;
  onRemoveTool?: (tool: string) => void;
  onUpdateTools?: (tools: string[]) => void;
}

const ITEMS_PER_PAGE = 3;

export const AutomationExpandedTools: React.FC<AutomationExpandedToolsProps> = ({ tools, isEditing, onRemoveTool, onUpdateTools }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { agents } = useAgentInfo();

  if (!isEditing && (!tools || tools.length === 0)) return null;

  const totalPages = Math.max(1, Math.ceil(tools.length / ITEMS_PER_PAGE));
  const displayedTools = tools.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const allTools = React.useMemo(() => {
    return Array.from(new Set(agents.flatMap(a => a.toolsEnabled || [])));
  }, [agents]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{ overflow: 'hidden' }}
    >
      <Box px="xs">
        <Paper
          withBorder
          shadow="xs"
          p="sm"
          className="nodrag"
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'light-dark(var(--mantine-color-zinc-0), var(--mantine-color-zinc-9))',
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: '0 0 var(--mantine-radius-md) var(--mantine-radius-md)'
          }}
        >
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <Flex gap={6} direction="column">
                  {displayedTools.map((tool, index) => {
                    const toolInfo = getToolInfo(tool, agents);
                    return (
                      <Group
                        key={index}
                        w="100%"
                        justify="space-between"
                        wrap="nowrap"
                        className="automation-tool-item"
                      >
                        <Group gap="sm" wrap="nowrap" style={{ overflow: 'hidden' }}>
                          <ThemeIcon
                            variant="outline"
                            size="sm"
                            radius="xs"
                            bg="body.2"
                            style={{
                              border: `1px solid ${toolInfo.color}`,
                              color: toolInfo.color,
                              flexShrink: 0
                            }}
                          >
                            {toolInfo.icon}
                          </ThemeIcon>
                          <Text size="xs" fw={600} truncate>
                            {toolInfo.name}
                          </Text>
                        </Group>
                        {isEditing && onRemoveTool && (
                          <ActionIcon
                            size="xs"
                            color="red"
                            variant="subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveTool(tool);
                              const newTotalPages = Math.max(1, Math.ceil((tools.length - 1) / ITEMS_PER_PAGE));
                              if (currentPage >= newTotalPages) {
                                setCurrentPage(Math.max(0, newTotalPages - 1));
                              }
                            }}
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                    );
                  })}
                  {displayedTools.length === 0 && isEditing && (
                    <Text size="xs" c="dimmed" ta="center" py="xs">No tools added</Text>
                  )}
                </Flex>
              </motion.div>
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <Group justify="space-between" align="center" mt="xs" pt="5" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <ActionIcon
                variant="transparent"
                size="sm"
                className="nodrag automation-paginator-btn"
                disabled={currentPage === 0}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => p - 1);
                }}
                c="dimmed"
              >
                <IconChevronLeft size={16} />
              </ActionIcon>

              <Text size="10px" c="dimmed" fw={500}>
                {currentPage + 1} / {totalPages}
              </Text>

              <ActionIcon
                variant="transparent"
                size="sm"
                className="nodrag automation-paginator-btn"
                disabled={currentPage >= totalPages - 1}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => p + 1);
                }}
                c="dimmed"
              >
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>
          )}

          {isEditing && onUpdateTools && (
            <Box mt="xs" pt="sm" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Button
                variant="light"
                size="xs"
                fullWidth
                leftSection={<IconPlus size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Manage Tools
              </Button>
            </Box>
          )}
        </Paper>

        {isEditing && onUpdateTools && (
          <ManageToolsModal
            opened={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            currentTools={tools}
            onUpdateTools={(newTools) => {
              onUpdateTools(newTools);
              // Calculate page after updating tools
              const newTotalPages = Math.max(1, Math.ceil(newTools.length / ITEMS_PER_PAGE));
              setCurrentPage(Math.min(currentPage, newTotalPages - 1));
            }}
          />
        )}
      </Box>
    </motion.div>
  );
};

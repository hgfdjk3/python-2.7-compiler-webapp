import React, { useState } from 'react';
import { Group, Paper, Flex, ThemeIcon, Text, Box, ActionIcon } from '@mantine/core';
import { IconTool, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'motion/react';
import { getToolInfo } from '../../../../utils/agentUtils';
import './AutomationNode.css';

export interface AutomationExpandedToolsProps {
  tools: string[];
}

const ITEMS_PER_PAGE = 3;

export const AutomationExpandedTools: React.FC<AutomationExpandedToolsProps> = ({ tools }) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!tools || tools.length === 0) return null;

  const totalPages = Math.ceil(tools.length / ITEMS_PER_PAGE);
  const displayedTools = tools.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

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
                    const toolInfo = getToolInfo(tool);
                    return (
                      <Group
                        key={index}
                        w="100%"
                        className="automation-tool-item"
                      >
                        <ThemeIcon
                          variant="outline"
                          size="sm"
                          radius="xs"
                          bg="body.2"
                          style={{
                            border: `1px solid ${toolInfo.color}`,
                            color: toolInfo.color
                          }}
                        >
                          {toolInfo.icon}
                        </ThemeIcon>
                        <Text size="xs" fw={600}>
                          {toolInfo.name}
                        </Text>
                      </Group>
                    );
                  })}
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
                disabled={currentPage === totalPages - 1}
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
        </Paper>
      </Box>
    </motion.div>
  );
};

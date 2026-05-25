import React from 'react';
import { Box, Text, Group, Loader } from '@mantine/core';
import { NodeExecutionState } from '../../../../../api/automations';
import { IconCheck, IconX, IconTool, IconBrain } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'motion/react';

export interface AutomationNodeExecutionProps {
  state: NodeExecutionState;
}

export const AutomationNodeExecution: React.FC<AutomationNodeExecutionProps> = ({ state }) => {
  if (state.status === 'idle') return null;

  // Determine what to show
  let content = null;
  
  if (state.status === 'completed') {
    content = (
      <Group gap="xs" wrap="nowrap">
        <IconCheck size={14} color="var(--mantine-color-teal-6)" />
        <Text size="xs" fw={500} c="teal.6">Completed</Text>
      </Group>
    );
  } else if (state.status === 'error') {
    content = (
      <Group gap="xs" wrap="nowrap">
        <IconX size={14} color="var(--mantine-color-red-6)" />
        <Text size="xs" fw={500} c="red.6">Failed</Text>
      </Group>
    );
  } else if (state.status === 'running') {
    // If running, see if we are using a tool
    const activeTool = state.tools && state.tools.find(t => t.output === null);
    if (activeTool) {
      content = (
        <Group gap="xs" wrap="nowrap">
          <Loader size="xs" color="blue" />
          <IconTool size={14} color="var(--mantine-color-blue-6)" />
          <Text size="xs" fw={500} c="blue.6">Running {activeTool.name}...</Text>
        </Group>
      );
    } else {
      content = (
        <Group gap="xs" wrap="nowrap">
          <Loader size="xs" color="blue" type="dots" />
          <IconBrain size={14} color="var(--mantine-color-blue-6)" />
          <Text size="xs" fw={500} c="blue.6">Thinking...</Text>
        </Group>
      );
    }
  }

  // Generate a stable key for the animation based on current state
  const animKey = state.status === 'running' 
    ? `${state.status}-${state.tools?.find(t => t.output === null)?.name || 'thinking'}`
    : state.status;

  return (
    <Box mt="xs" style={{ minHeight: 28, display: 'flex', alignItems: 'center' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={animKey}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <Box bg="var(--mantine-color-gray-0)" px={8} py={4} style={{ borderRadius: 6, border: '1px solid var(--mantine-color-gray-3)', display: 'inline-block' }}>
            {content}
          </Box>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

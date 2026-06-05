import React from 'react';
import { Box, Text, Group, Loader } from '@mantine/core';
import { IconCheck, IconX, IconBrain } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'motion/react';
import { NodeExecutionState } from '@/api/automations';
import { AtomLoader } from '@/components/AtomLoader';
import { getToolIcon } from '@/utils/iconUtils';

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
        <IconCheck size={14} />
        <Text size="xs" fw={500}>Completed </Text>
      </Group>
    );
  } else if (state.status === 'error') {
    content = (
      <Group gap="xs" wrap="nowrap">
        <IconX size={14} color="var(--mantine-color-red-6)" />
        <Text size="xs" fw={500} c="red.6" truncate>Failed: {state.content}</Text>
      </Group>
    );
  } else if (state.status === 'running') {
    // If running, see if we are using a tool
    const activeTool = state.tools && state.tools.find(t => t.output === null);
    if (activeTool) {
      content = (
        <Group gap="xs" wrap="nowrap">
          <Loader size="xs" color="zinc" />
          {getToolIcon(activeTool.name, { size: 14 })}
          <Text size="xs" fw={500}>Running {activeTool.name}...</Text>
        </Group>
      );
    } else {
      content = (
        <Group gap="5" wrap="nowrap" w="100%">
          {/* <Loader size={14} color="zinc" /> */}
          {/* <IconBrain size={14} /> */}
          <AtomLoader size={20} />
          <Text size="xs" fw={500} truncate inline>{state.content || "Thinking..."}</Text>
        </Group>
      );
    }
  }

  // Generate a stable key for the animation based on current state
  const animKey = state.status === 'running'
    ? `${state.status}-${state.tools?.find(t => t.output === null)?.name || 'thinking'}`
    : state.status;

  return (
    <Box mt="xs" w="100%" style={{ minHeight: 28, display: 'flex', alignItems: 'center' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={animKey}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 15 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', overflow: 'hidden' }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

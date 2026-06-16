import React from 'react';
import { Group, Loader, Text } from '@mantine/core';
import { motion } from 'motion/react';

export const ThinkingBlock: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Group gap="xs" justify="end" mt="sm" w="100%">
        <Loader size="sm" type="dots" color="gray" />
        <Text size="sm" c="dimmed" fs="italic">Thinking</Text>
      </Group>
    </motion.div>
  );
};

import React from 'react';
import { Group, Text, ActionIcon } from '@mantine/core';
import { IconChevronLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

interface DevSubHeaderProps {
  title: string;
  backTo: string;
}

export const DevSubHeader: React.FC<DevSubHeaderProps> = ({ title, backTo }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ marginBottom: 36 }}
    >
      <Group gap="xs" mb={12} style={{ cursor: 'pointer' }} onClick={() => navigate(backTo)}>
        <ActionIcon variant="subtle" color="gray" size="sm">
          <IconChevronLeft size={16} stroke={1.5} />
        </ActionIcon>
        <Text size="xs" c="dimmed" fw={500}>
          Developer Hub
        </Text>
      </Group>
      <Text fw={800} size="xl" style={{ letterSpacing: '-0.5px' }}>
        {title}
      </Text>
    </motion.div>
  );
};

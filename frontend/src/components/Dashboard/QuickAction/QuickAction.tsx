import React from 'react';
import { Box, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { motion } from 'motion/react';
import './QuickAction.css';

interface QuickActionProps {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  label,
  description,
  icon: Icon,
  color,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <UnstyledButton className="quick-action" onClick={onClick}>
        <ThemeIcon
          variant="light"
          color={color}
          size={40}
          radius="md"
          className="quick-action-icon"
        >
          <Icon size={20} stroke={1.5} />
        </ThemeIcon>
        <Box mt="sm">
          <Text size="sm" fw={600}>
            {label}
          </Text>
          <Text size="xs" c="dimmed" mt={2} lh={1.4}>
            {description}
          </Text>
        </Box>
      </UnstyledButton>
    </motion.div>
  );
};

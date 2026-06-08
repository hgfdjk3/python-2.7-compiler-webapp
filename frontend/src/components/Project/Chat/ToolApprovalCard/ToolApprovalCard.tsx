import React, { useState } from 'react';
import { Card, Group, Text, ThemeIcon, Button, Box, useMantineTheme, Collapse, Code } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { getToolInfo } from '../../../../utils/agentUtils';
import './ToolApprovalCard.css';

interface ToolApprovalCardProps {
  toolName: string;
  toolArgs?: any;
  onDecision: (decision: 'allow' | 'reject' | 'try_again' | 'always_allow') => void;
  isSubmitting?: boolean;
}

export const ToolApprovalCard: React.FC<ToolApprovalCardProps> = ({ toolName, onDecision, isSubmitting = false }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Box>
          <Group justify="flex-start" gap="xs" wrap="nowrap">
            <Button
              variant="subtle"
              color="gray"
              size="compact-sm"
              onClick={() => onDecision('reject')}
              disabled={isSubmitting}
            >
              Reject
            </Button>
            <Button
              variant="default"
              size="compact-sm"
              onClick={() => onDecision('always_allow')}
              disabled={isSubmitting}
            >
              Always Allow
            </Button>
            <Button
              variant="filled"
              size="compact-sm"
              onClick={() => onDecision('allow')}
              loading={isSubmitting}
            >
              Allow
            </Button>
          </Group>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

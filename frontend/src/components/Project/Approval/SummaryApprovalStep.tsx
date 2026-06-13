import React from 'react';
import { Stack, Title, Text, Group, Button, ScrollArea, Box, ActionIcon, Tooltip } from '@mantine/core';
import { IconCheck, IconX, IconPlayerSkipForward } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { ApprovalDiffViewer } from './ApprovalDiffViewer';

interface SummaryApprovalStepProps {
  projectId: string;
  currentText: string;
  proposedText: string;
}

export const SummaryApprovalStep: React.FC<SummaryApprovalStepProps> = ({
  projectId,
  currentText,
  proposedText,
}) => {

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Stack gap="md">
        <Box>
          <Title order={3}>Library Summary Update</Title>
          <Text c="dimmed" size="sm">
            Review the proposed changes to the project's library summary.
          </Text>
        </Box>

        <ScrollArea.Autosize mah={400} type="auto" offsetScrollbars>
          <Box style={{ borderLeft: '2px solid var(--mantine-color-dark-4)', paddingLeft: 'var(--mantine-spacing-md)' }}>
            <ApprovalDiffViewer oldText={currentText} newText={proposedText} />
          </Box>
        </ScrollArea.Autosize>
      </Stack>
    </motion.div>
  );
};

// Also export Box since it is used in the component

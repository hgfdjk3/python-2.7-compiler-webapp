import React from 'react';
import { Stack, Text, Title, Button, Group, Box, Badge } from '@mantine/core';
import { IconCheck, IconPlayerSkipForward } from '@tabler/icons-react';
import { motion } from 'motion/react';

interface ApprovalStartScreenProps {
  hasNewSummary: boolean;
  newEntitiesCount: number;
  updatedEntitiesCount: number;
  onStartReview: () => void;
  onSkip: () => void;
}

export const ApprovalStartScreen: React.FC<ApprovalStartScreenProps> = ({
  hasNewSummary,
  newEntitiesCount,
  updatedEntitiesCount,
  onStartReview,
  onSkip,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Stack gap="xl" align="flex-start">
        <Box>
          <Title order={2} fw={700} mb="xs">
            Library Pending Approvals
          </Title>
          <Text c="dimmed">
            You have new project updates that require your review.
          </Text>
        </Box>

        <Stack gap="sm">
          {hasNewSummary && (
            <Group gap="xs">
              <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-blue-5)' }} />
              <Text size="sm" fw={500}>New Library Summary</Text>
            </Group>
          )}
          {newEntitiesCount > 0 && (
            <Group gap="xs">
              <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-green-5)' }} />
              <Text size="sm" fw={500}>{newEntitiesCount} New Source{newEntitiesCount > 1 ? 's' : ''}</Text>
            </Group>
          )}
          {updatedEntitiesCount > 0 && (
            <Group gap="xs">
              <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-orange-5)' }} />
              <Text size="sm" fw={500}>{updatedEntitiesCount} Updated Source{updatedEntitiesCount > 1 ? 's' : ''}</Text>
            </Group>
          )}
        </Stack>

        <Group mt="xl" pt="xl">
          <Button variant="subtle" color="gray" onClick={onSkip} leftSection={<IconPlayerSkipForward size={16} />}>
            Skip for now
          </Button>
          <Button onClick={onStartReview} leftSection={<IconCheck size={16} />} size="md">
            Review Changes
          </Button>
        </Group>
      </Stack>
    </motion.div>
  );
};

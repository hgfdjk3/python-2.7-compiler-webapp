import React from 'react';
import { Stack, Text, Title, Button, Group, Box, Badge } from '@mantine/core';
import { IconCheck, IconX, IconPlayerSkipForward } from '@tabler/icons-react';
import { motion } from 'motion/react';

interface ApprovalStartScreenProps {
  hasNewSummary: boolean;
  newEntitiesCount: number;
  updatedEntitiesCount: number;
  onStartReview: () => void;
  onSkip: () => void;
  onApproveAll?: () => void;
  onRejectAll?: () => void;
  isApprovingAll?: boolean;
  isRejectingAll?: boolean;
}

export const ApprovalStartScreen: React.FC<ApprovalStartScreenProps> = ({
  hasNewSummary,
  newEntitiesCount,
  updatedEntitiesCount,
  onStartReview,
  onSkip,
  onApproveAll,
  onRejectAll,
  isApprovingAll,
  isRejectingAll,
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

        <Group mt="xl" pt="xl" w="100%" justify="space-between">
          <Button variant="subtle" color="gray" onClick={onSkip} leftSection={<IconPlayerSkipForward size={16} />}>
            Skip
          </Button>
          <Group>
            {onRejectAll && (
              <Button variant="light" color="red" onClick={onRejectAll} loading={isRejectingAll} disabled={isApprovingAll} leftSection={<IconX size={16} />}>
                Reject All
              </Button>
            )}
            {onApproveAll && (
              <Button variant="light" color="green" onClick={onApproveAll} loading={isApprovingAll} disabled={isRejectingAll} leftSection={<IconCheck size={16} />}>
                Approve All
              </Button>
            )}
            <Button onClick={onStartReview} >
              Review Singly
            </Button>
          </Group>
        </Group>
      </Stack>
    </motion.div>
  );
};

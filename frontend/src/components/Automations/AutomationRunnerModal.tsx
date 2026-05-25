import React from 'react';
import { Modal, Button, Text, ScrollArea, Group, Box } from '@mantine/core';
import { IconPlayerPlay, IconRobot } from '@tabler/icons-react';
import { useAutomationRun } from '../../hooks/useAutomationRun';
import { MarkdownResponse } from '../Project/Chat/MarkdownResponse';

export interface AutomationRunnerModalProps {
  opened: boolean;
  onClose: () => void;
  automationId: string;
}

export const AutomationRunnerModal: React.FC<AutomationRunnerModalProps> = ({
  opened,
  onClose,
  automationId,
}) => {
  const { mutate, isPending, streamedContent, clearStream } = useAutomationRun(automationId);

  const handleRun = () => {
    clearStream();
    mutate({ inputText: 'Run this automation now.' });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconRobot size={20} />
          <Text fw={600}>Automation Runner</Text>
        </Group>
      }
      size="lg"
    >
      <Box mb="md">
        <Text size="sm" c="dimmed">
          Watch the real-time execution logs and output as the automation stages run.
        </Text>
      </Box>

      <ScrollArea
        h={400}
        type="auto"
        bg="var(--mantine-color-gray-0)"
        p="sm"
        style={{ borderRadius: '8px', border: '1px solid var(--mantine-color-gray-3)' }}
      >
        {streamedContent ? (
          <Box p="xs" style={{ minWidth: '100%' }}>
            <MarkdownResponse content={streamedContent} />
          </Box>
        ) : (
          <Text size="sm" c="dimmed" ta="center" mt={100}>
            No output yet. Click 'Run' to start.
          </Text>
        )}
      </ScrollArea>

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={handleRun}
          loading={isPending}
          leftSection={!isPending && <IconPlayerPlay size={16} />}
          color="blue"
        >
          {isPending ? 'Running...' : 'Run'}
        </Button>
      </Group>
    </Modal>
  );
};

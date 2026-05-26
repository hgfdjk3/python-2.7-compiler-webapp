import React from 'react';
import { Modal, Button, Group, Text, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertCircle, IconPlayerPlay } from '@tabler/icons-react';

interface RunAutomationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirmRun: () => void;
  isSavedBefore: boolean;
  isRunning: boolean;
}

export const RunAutomationModal: React.FC<RunAutomationModalProps> = ({
  opened,
  onClose,
  onConfirmRun,
  isSavedBefore,
  isRunning
}) => {
  return (
    <Modal
      centered
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="lg">
          {isSavedBefore ? 'Run Automation' : 'Action Required'}
        </Text>
      }
      size="sm"
      radius="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md">
        {!isSavedBefore ? (
          <>
            <Group wrap="nowrap" align="flex-start">
              <ThemeIcon color="orange" variant="light" size="xl" radius="md">
                <IconAlertCircle size={24} />
              </ThemeIcon>
              <Text size="sm">
                You must save this automation before you can run it. Please save your changes first to ensure the latest workflow is executed.
              </Text>
            </Group>
            <Group justify="flex-end" mt="sm">
              <Button onClick={onClose} variant="default">
                Close
              </Button>
            </Group>
          </>
        ) : (
          <>
            <Text size="sm">
              Are you sure you want to run this automation manually right now?
            </Text>
            <Group justify="flex-end" mt="md" grow>
              <Button variant="default" onClick={onClose} disabled={isRunning}>
                Cancel
              </Button>
              <Button
                onClick={onConfirmRun}
                loading={isRunning}
                leftSection={<IconPlayerPlay size={16} />}
              >
                Run Now
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
};

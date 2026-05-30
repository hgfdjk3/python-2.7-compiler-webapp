import React from 'react';
import { Modal, Button, Group, Text, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertCircle, IconPlayerPlay, IconDeviceFloppy } from '@tabler/icons-react';

interface RunAutomationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirmRun: (saveFirst: boolean) => void;
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
          Run Automation
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
            <Text size="sm">
              You have unsaved changes in this automation. You can run it temporarily without saving, or save it first.
            </Text>
            <Group justify="flex-end" mt="md" >
              <Button flex={4} variant="default" onClick={() => onConfirmRun(false)} disabled={isRunning} leftSection={<IconPlayerPlay size={16} />}>
                Run Without Saving
              </Button>
              <Button flex={2}
                onClick={() => onConfirmRun(true)}
                loading={isRunning}
                leftSection={<IconDeviceFloppy size={16} />}
              >
                Save
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
                onClick={() => onConfirmRun(false)}
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

import React from 'react';
import { Modal, Button, Group, Text, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertCircle, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';

interface ToggleAutomationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isActivating: boolean;
  isLoading: boolean;
}

export const ToggleAutomationModal: React.FC<ToggleAutomationModalProps> = ({
  opened,
  onClose,
  onConfirm,
  isActivating,
  isLoading
}) => {
  return (
    <Modal
      centered
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="lg">
          {isActivating ? 'Enable Automation' : 'Disable Automation'}
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
        <Text size="sm">
          {isActivating
            ? 'Are you sure you want to enable this scheduled automation? It will run according to its configured schedule.'
            : 'Are you sure you want to disable this scheduled automation? It will no longer run automatically.'}
        </Text>
        <Group justify="flex-end" mt="md" grow>
          <Button variant="default" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            loading={isLoading}
            leftSection={isActivating ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
          >
            {isActivating ? 'Enable' : 'Disable'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { Modal, Button, Group, Text, Stack, TextInput, Box, Badge, Divider } from '@mantine/core';
import { IconDeviceFloppy, IconCheck } from '@tabler/icons-react';

interface SaveAutomationModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName: string;
  isSavedBefore: boolean;
  isSaving: boolean;
  stats?: {
    nodesCount: number;
    edgesCount: number;
    toolsUsed: number;
  };
}

export const SaveAutomationModal: React.FC<SaveAutomationModalProps> = ({
  opened,
  onClose,
  onSave,
  initialName,
  isSavedBefore,
  isSaving,
  stats
}) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName, opened]);

  return (
    <Modal
      centered
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="lg">
          {isSavedBefore ? 'Save Changes' : 'Save Automation'}
        </Text>
      }
      size="md"
      radius="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md">
        <TextInput
          label="Automation Name"
          placeholder="e.g. Onboarding Workflow"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
          autoFocus
          data-autofocus
        />

        {isSavedBefore && stats && (
          <Box p="sm" >
            <Text size="sm" fw={500} mb="xs">Automation Statistics</Text>
            <Divider mb="xs" style={{ opacity: 0.5 }} />
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed">Nodes Count</Text>
              <Text size='xs'>{stats.nodesCount}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Tools Used</Text>
              <Text size='xs'>{stats.toolsUsed}</Text>
            </Group>
          </Box>
        )}

        {!isSavedBefore && (
          <Text size="sm" c="dimmed">
            Give your automation a descriptive name so you can easily identify it later in your project dashboard.
          </Text>
        )}

        <Group justify="flex-end" grow mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(name)}
            loading={isSaving}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            {isSavedBefore ? 'Save Changes' : 'Save Automation'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

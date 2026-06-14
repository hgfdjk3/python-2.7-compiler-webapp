import React, { useState, useEffect } from 'react';
import { Modal, Button, Group, Text, Stack, TextInput, Box, Switch, Divider } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { ScheduleConfigurator, ScheduleConfig } from '../ScheduleConfigurator';

export interface SaveAutomationModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (name: string, isScheduled: boolean, scheduleConfig: ScheduleConfig | undefined) => void;
  initialName: string;
  isSavedBefore: boolean;
  isSaving: boolean;
  initialIsScheduled: boolean;
  initialScheduleConfig?: ScheduleConfig;
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
  initialIsScheduled,
  initialScheduleConfig,
  stats
}) => {
  const [name, setName] = useState(initialName);
  const [isScheduled, setIsScheduled] = useState(initialIsScheduled);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | undefined>(initialScheduleConfig);

  useEffect(() => {
    if (opened) {
      setName(initialName);
      setIsScheduled(initialIsScheduled);
      setScheduleConfig(initialScheduleConfig);
    }
  }, [opened, initialName, initialIsScheduled, initialScheduleConfig]);

  return (
    <Modal
      centered
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="lg">
          {isSavedBefore ? 'Edit Automation Details' : 'Save Automation'}
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

        <Switch
          label="Schedule Automation"
          description="Run this automation automatically on a recurring schedule"
          checked={isScheduled}
          onChange={(e) => setIsScheduled(e.currentTarget.checked)}
        />

        {isScheduled && (
          <Box
            p="md"
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 'var(--mantine-radius-md)',
              backgroundColor: 'light-dark(var(--mantine-color-zinc-0), var(--mantine-color-zinc-9))'
            }}
          >
            <ScheduleConfigurator
              value={scheduleConfig}
              onChange={setScheduleConfig}
            />
          </Box>
        )}

        {isSavedBefore && stats && (
          <Box p="sm" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)', opacity: 0.8 }}>
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
            Give your automation a descriptive name and schedule so you can easily identify it later in your project dashboard.
          </Text>
        )}

        <Group justify="flex-end" grow mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(name, isScheduled, scheduleConfig)}
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

import React, { useState, useEffect } from 'react';
import { Modal, Button, Group, Box } from '@mantine/core';
import { ScheduleConfigurator, ScheduleConfig } from './ScheduleConfigurator';

interface ScheduleConfiguratorModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (config: ScheduleConfig) => void;
  automationName?: string;
  initialConfig?: ScheduleConfig;
}

export const ScheduleConfiguratorModal: React.FC<ScheduleConfiguratorModalProps> = ({
  opened,
  onClose,
  onSave,
  automationName,
  initialConfig,
}) => {
  const [config, setConfig] = useState<ScheduleConfig | undefined>(initialConfig);

  // Reset internal state when modal opens with new initialConfig
  useEffect(() => {
    if (opened) {
      setConfig(initialConfig);
    }
  }, [opened, initialConfig]);

  const handleSave = () => {
    if (config) {
      onSave(config);
    }
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Schedule ${automationName ? `"${automationName}"` : 'Automation'}`}
      size="md"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Box pt="md" pb="xl">
        <ScheduleConfigurator
          value={config}
          onChange={setConfig}
        />
      </Box>

      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Schedule
        </Button>
      </Group>
    </Modal>
  );
};

// Box was missing in import, adding it here. (Wait, let me just replace the file content with the correct import).

import React from 'react';
import { Button, Tooltip, ActionIcon } from '@mantine/core';
import { IconDeviceFloppy, IconEdit } from '@tabler/icons-react';

export interface AutomationSaveButtonProps {
  automationId?: string;
  onSave: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
  variant?: 'button' | 'icon';
}

export const AutomationSaveButton: React.FC<AutomationSaveButtonProps> = ({
  automationId,
  onSave,
  isSaving = false,
  hasChanges = false,
  variant = 'button',
}) => {
  const isSaved = !!automationId;
  const label = isSaved ? 'Edit Automation' : 'Save';
  const tooltipLabel = isSaved ? 'Edit Automation details and schedule' : 'Save Automation';
  const Icon = isSaved ? IconEdit : IconDeviceFloppy;
  const isDisabled = isSaving;

  if (variant === 'icon') {
    return (
      <Tooltip label={tooltipLabel} withArrow position="top">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          radius="md"
          loading={isSaving}
          onClick={onSave}
          disabled={isDisabled}
        >
          <Icon size={16} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={tooltipLabel} withArrow position="top">
      <Button
        leftSection={<Icon size={14} />}
        variant="light"
        color="dark"
        size="compact-sm"
        loading={isSaving}
        loaderProps={{ type: 'dots' }}
        onClick={onSave}
        disabled={isDisabled}
        style={{ fontWeight: 500, height: 26 }}
        className="action-btn"
      >
        {label}
      </Button>
    </Tooltip>
  );
};

import React from 'react';
import { Button, Tooltip } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';

export interface AutomationSaveButtonProps {
  onSave: () => void;
  isSaving?: boolean;
}

export const AutomationSaveButton: React.FC<AutomationSaveButtonProps> = ({
  onSave,
  isSaving
}) => {
  return (
    <Tooltip label="Save Automation" withArrow position="top">
      <Button 
        leftSection={<IconDeviceFloppy size={14} />} 
        variant="light" 
        color="dark"
        size="compact-sm"
        loading={isSaving}
        loaderProps={{ type: 'dots' }}
        onClick={onSave}
        style={{ fontWeight: 500, height: 26 }}
        className="action-btn"
      >
        Save
      </Button>
    </Tooltip>
  );
};

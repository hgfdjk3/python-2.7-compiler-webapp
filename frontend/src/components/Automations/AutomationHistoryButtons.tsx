import React from 'react';
import { ActionIcon, Tooltip, Button } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';

export interface AutomationHistoryButtonsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const AutomationHistoryButtons: React.FC<AutomationHistoryButtonsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  return (
    <Button.Group className="action-btn">
      <Tooltip label="Undo" withArrow position="top">
        <ActionIcon 
          variant="light" 
          color="dark" 
          size="sm" 
          onClick={onUndo} 
          disabled={!canUndo}
          style={{ height: 26, width: 26, borderRight: '1px solid rgba(150, 150, 150, 0.2)', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
        >
          <IconArrowBackUp size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Redo" withArrow position="top">
        <ActionIcon 
          variant="light" 
          color="dark" 
          size="sm" 
          onClick={onRedo} 
          disabled={!canRedo}
          style={{ height: 26, width: 26, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
        >
          <IconArrowForwardUp size={14} />
        </ActionIcon>
      </Tooltip>
    </Button.Group>
  );
};

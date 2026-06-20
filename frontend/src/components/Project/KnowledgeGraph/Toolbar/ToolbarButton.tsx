import React from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  color?: string;
  disabled?: boolean;
  onClick: () => void;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  color = 'blue',
  disabled = false,
  onClick
}) => {
  return (
    <Tooltip label={label}>
      <ActionIcon
        variant="light"
        size="lg"
        color={color}
        radius="xl"
        disabled={disabled}
        onClick={onClick}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  );
};

import React from 'react';
import { ActionIcon, Button, ButtonProps } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { Source } from '../../Sources/types';
import { getSourceStyle } from '../../Sources/sourceTypes';

export interface PromptInputSourceBadgeProps extends Omit<ButtonProps, 'rightSection'> {
  source: Source;
  onDetachSource?: (sourceId: string) => void;
  onClick?: () => void;
}

export const PromptInputSourceBadge: React.FC<PromptInputSourceBadgeProps> = ({
  source,
  onDetachSource,
  onClick,
  ...buttonProps
}) => {
  const styleInfo = getSourceStyle(source.type);
  const color = source.color || styleInfo.color;

  return (
    <Button
      size="xs"
      variant="light"
      color={color}
      radius="xl"
      onClick={onClick}
      leftSection={styleInfo.icon}
      rightSection={
        onDetachSource ? (
          <ActionIcon
            size="xs"
            variant="subtle"
            color={color}
            radius="xl"
            onClick={(e) => {
              e.stopPropagation();
              onDetachSource(source.id);
            }}
            aria-label={`Remove ${source.title}`}
          >
            <IconX size={10} stroke={1.5} />
          </ActionIcon>
        ) : undefined
      }
      {...buttonProps}
    >
      {source.title}
    </Button>
  );
};

import React from 'react';
import { Button, Text, Textarea } from '@mantine/core';
import { AutomationNodeTools } from './AutomationNodeTools';
import { IconCheck, IconWand } from '@tabler/icons-react';
import { useUncontrolled, useThrottledCallback } from '@mantine/hooks';

interface AutomationNodeContentProps {
  description: string;
  tools?: string[];
  toolsExpanded: boolean;
  onToggleTools: () => void;
  isEditing?: boolean;
  onDescriptionChange?: (val: string) => void;
  onFinishEditing?: () => void;
  color?: string;
}

export const AutomationNodeContent: React.FC<AutomationNodeContentProps> = ({
  description,
  tools,
  toolsExpanded,
  onToggleTools,
  isEditing,
  onDescriptionChange,
  color,
  onFinishEditing,
}) => {
  const throttledSave = useThrottledCallback((val: string) => {
    onDescriptionChange?.(val);
  }, 1000);

  const [localDescription, setLocalDescription] = useUncontrolled({
    value: isEditing ? undefined : description,
    defaultValue: description,
    onChange: (val) => {
      if (val.trim().length >= 50) {
        throttledSave(val);
      }
    },
  });

  const MIN_LENGTH = 50;
  const canSave = localDescription.trim().length >= MIN_LENGTH;

  const handleSave = () => {
    if (canSave) {
      onDescriptionChange?.(localDescription);
      onFinishEditing?.();
    }
  };

  return (
    <>
      {isEditing ? (
        <Textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.currentTarget.value)}
          // onBlur={onFinishEditing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && canSave) {
              e.preventDefault();
              handleSave();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              onFinishEditing?.();
            }
          }}
          rightSection={<Button
            mt="auto"
            mr="4"
            mb="5"
            color={color}
            disabled={!canSave}
            variant='filled'
            size='compact-xs'
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}>
            {canSave ? <IconCheck size={10} /> : `${localDescription.length}/${MIN_LENGTH}`}
          </Button>}
          autosize
          minRows={1}
          maxRows={6}
          variant="filled"
          size="sm"
          p="0"
          maxLength={512}
          className="automation-node-description nodrag nowheel"
          autoFocus
          styles={{ input: { overflow: 'hidden' }, section: { width: 'auto', padding: 0 } }}
        />
      ) : (
        <Text size="sm" lineClamp={2} className="automation-node-description">
          {description}
        </Text>
      )}

      {tools && tools.length > 0 && (
        <AutomationNodeTools
          tools={tools}
          expanded={toolsExpanded}
          onToggle={onToggleTools}
        />
      )}
    </>
  );
};

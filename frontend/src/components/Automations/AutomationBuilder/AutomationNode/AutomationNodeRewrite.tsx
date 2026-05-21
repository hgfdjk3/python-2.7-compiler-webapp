import React from 'react';
import { Stack, TextInput, ActionIcon } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

interface AutomationNodeRewriteProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  onRewrite: () => void;
  onCancel: () => void;
}

export const AutomationNodeRewrite: React.FC<AutomationNodeRewriteProps> = ({
  prompt,
  onPromptChange,
  onRewrite,
  onCancel,
}) => {
  return (
    <Stack gap={6} className="ai-rewrite-input nodrag">
      <TextInput
        placeholder="How should AI rewrite this step?"
        size="sm"
        variant="filled"
        value={prompt}
        onChange={(e) => onPromptChange(e.currentTarget.value)}
        autoFocus
        rightSection={
          <ActionIcon 
            size="md" 
            variant="subtle" 
            color="blue" 
            onClick={onRewrite}
            disabled={!prompt.trim()}
          >
            <IconSend size={18} />
          </ActionIcon>
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') onRewrite();
          if (e.key === 'Escape') onCancel();
        }}
      />
    </Stack>
  );
};

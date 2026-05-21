import React, { useState } from 'react';
import { ActionIcon, Box, Button, Group, Paper, Textarea, useMantineTheme, rem, Divider } from '@mantine/core';
import { useDroppable } from '@dnd-kit/react';
import { IconBolt, IconCornerDownLeft, IconEye, IconFileCode, IconPlus, IconX } from '@tabler/icons-react';
import { Source } from '../../Sources/types';
import { PromptInputSources } from './PromptInputSources';
import { PromptActions } from './PromptActions/PromptActions';

import './PromptInput.css';

export interface PromptMode {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface PromptInputProps {
  placeholder?: string;
  modes?: PromptMode[];
  onSubmit?: (value: string, modeId: string) => void;
  onValueChange?: (value: string) => void;
  onClose?: () => void;
  initialValue?: string;
  initialModeId?: string;
  submitColor?: string;
  attachedSources?: Source[];
  onAttachSource?: () => void;
  onManageAgents?: () => void;
  onDetachSource?: (sourceId: string) => void;
  emptySourcesLabel?: string;
  isAutomationMode?: boolean;
  onAutomationModeToggle?: (active: boolean) => void;
}

const DEFAULT_MODES: PromptMode[] = [];

export const PromptInput: React.FC<PromptInputProps> = ({
  placeholder = 'What would you like to know?',
  modes = DEFAULT_MODES,
  onSubmit,
  onValueChange,
  onClose,
  initialValue = '',
  initialModeId,
  submitColor = 'blue',
  attachedSources = [],
  onAttachSource,
  onManageAgents,
  onDetachSource,
  emptySourcesLabel,
  isAutomationMode: externalIsAutomationMode,
  onAutomationModeToggle,
}) => {
  const [value, setValue] = useState(initialValue);
  const [internalIsAutomationMode, setInternalIsAutomationMode] = useState(false);
  const isAutomationMode = externalIsAutomationMode ?? internalIsAutomationMode;

  const [activeModeId, setActiveModeId] = useState(initialModeId || modes[0]?.id || '');
  const theme = useMantineTheme();
  const { ref, isDropTarget } = useDroppable({ id: 'prompt-input-sources' });

  const handleValueChange = (nextValue: string) => {
    setValue(nextValue);
    onValueChange?.(nextValue);
  };

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit?.(value, isAutomationMode ? 'automation' : activeModeId);
      setValue('');
      handleValueChange('');
    }
  };

  const handleToggleAutomation = () => {
    const newState = !isAutomationMode;
    if (externalIsAutomationMode === undefined) {
      setInternalIsAutomationMode(newState);
    }
    onAutomationModeToggle?.(newState);
  };

  return (
    <Box maw={760} mx="auto" w="100%" px="md">
      <Paper
        ref={ref}
        withBorder
        radius="lg"
        className="promptInputRoot"
        style={{
          position: 'relative',
          border: isAutomationMode
            ? `1px solid light-dark(${theme.colors.orange[4]}, ${theme.colors.orange[8]})`
            : `1px solid light-dark(${theme.colors.gray[2]}, ${theme.colors.dark[6]})`,
          borderRadius: theme.radius.lg,
          backgroundColor: `light-dark(${theme.white}, ${theme.colors.dark[8]})`,
          boxShadow: isAutomationMode
            ? `0 20px 40px -15px rgba(255, 145, 0, 0.15), 0 0 1px 0 rgba(255, 145, 0, 0.2)`
            : '0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 1px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          className="promptInputOverlay"
          data-over={isDropTarget || undefined}
        />

        <Box p="sm" className="promptInputContent">
          <Textarea
            placeholder={isAutomationMode ? "Describe the automation workflow you want to create..." : placeholder}
            variant="unstyled"
            autosize
            minRows={1}
            maxRows={10}
            value={value}
            onChange={(event) => handleValueChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            styles={{
              input: {
                fontSize: rem(15),
                padding: 0,
                paddingRight: rem(12),
                lineHeight: 1.6,
                color: `light-dark(${theme.colors.gray[8]}, ${theme.colors.gray[2]})`,
              },
            }}
          />

          <Group justify="space-between" mt="md" align="center">
            <Group gap="0">
              <PromptActions
                onAttachSource={onAttachSource}
                onManageAgents={onManageAgents}
              />
              <Divider mx="3" orientation='vertical' />
              <Button
                variant={isAutomationMode ? 'light' : 'subtle'}
                color={isAutomationMode ? 'orange' : 'gray'}
                size="xs"
                px={5}
                radius="xl"
                mr="5"
                onClick={handleToggleAutomation}
                fw={600}
                styles={{
                  root: {
                    color: isAutomationMode
                      ? theme.colors.orange[7]
                      : `light-dark(${theme.colors.gray[7]}, ${theme.colors.gray[4]})`,
                    backgroundColor: isAutomationMode
                      ? `light-dark(${theme.colors.orange[0]}, ${theme.colors.orange[5]}20)`
                      : undefined,
                  }
                }}
              >
                <IconBolt size={16} stroke={isAutomationMode ? 2.5 : 1.5} />
              </Button>

              <PromptInputSources
                attachedSources={attachedSources}
                onDetachSource={onDetachSource}
                emptySourcesLabel={emptySourcesLabel}
                isDropTarget={isDropTarget}
              />
              {modes.map((mode) => (
                <Button
                  key={mode.id}
                  variant={activeModeId === mode.id ? 'light' : 'subtle'}
                  color={activeModeId === mode.id ? 'blue' : 'gray'}
                  size="xs"
                  leftSection={mode.icon}
                  radius="xl"
                  fw={500}
                  onClick={() => setActiveModeId(mode.id)}
                  styles={{
                    root: {
                      color: activeModeId === mode.id
                        ? theme.colors.blue[6]
                        : `light-dark(${theme.colors.gray[7]}, ${theme.colors.gray[4]})`,
                    },
                  }}
                >
                  {mode.label}
                </Button>
              ))}
            </Group>

            <Group gap="xs">
              {onClose && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  radius="md"
                  onClick={onClose}
                  aria-label="Close prompt"
                >
                  <IconX size={18} stroke={1.5} />
                </ActionIcon>
              )}
              <ActionIcon
                variant="filled"
                color={isAutomationMode ? 'orange' : submitColor}
                size="lg"
                radius="md"
                disabled={!value.trim()}
                onClick={handleSubmit}
                aria-label="Submit prompt"
              >
                {isAutomationMode ? (
                  <IconBolt size={18} stroke={2} fill="currentColor" />
                ) : (
                  <IconCornerDownLeft size={18} stroke={2} />
                )}
              </ActionIcon>
            </Group>
          </Group>

        </Box>
      </Paper>
    </Box>
  );
};

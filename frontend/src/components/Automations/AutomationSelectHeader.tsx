import React, { useState, useEffect } from 'react';
import { Group, Select, ActionIcon, Flex, Tooltip, Badge, Text } from '@mantine/core';
import { IconSlash, IconPlayerPlay, IconBolt, IconDeviceFloppy, IconBriefcase, IconCategory, IconCalendarEvent } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../api/projects';
import { useProjectAutomations } from '../../api/automations';
import { AutomationSaveButton } from './AutomationSaveButton';

export interface AutomationSelectHeaderProps {
  automationId?: string;
  projectId?: string;
  hasChanges?: boolean;
  scheduleString?: string;
  isSaving?: boolean;
  onRun?: () => void;
  onSave?: () => void;
}

export const AutomationSelectHeader: React.FC<AutomationSelectHeaderProps> = ({
  automationId,
  projectId,
  hasChanges,
  scheduleString,
  isSaving,
  onRun,
  onSave,
}) => {
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId || null);

  useEffect(() => {
    if (projectId) setSelectedProjectId(projectId);
  }, [projectId]);

  const { data: automations } = useProjectAutomations(selectedProjectId || undefined);

  const projectOptions = projects?.map(p => ({ value: p.id, label: p.name })) || [];
  const automationOptions = automations?.map(a => ({ value: a.id, label: a.name })) || [];

  return (
    <Flex align="center" justify="space-between" w="100%" pb="xs" px="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Group gap="5" align="center">
        <Group gap="5" align="center">
          <IconCategory size={14} color="var(--mantine-primary-color-filled)" />
          <Text fz="sm">
            Project
          </Text>
        </Group>
        <Select
          placeholder="Select Project"
          data={projectOptions}
          value={selectedProjectId}
          onChange={(val) => {
            setSelectedProjectId(val);
            navigate('/automations');
          }}
          variant="filled"
          size="xs"
          styles={{
            input: { fontWeight: 500, width: 'auto', minWidth: '120px', backgroundColor: 'var(--mantine-color-zinc-8)' }
          }}
        />

        /
        <Select
          placeholder="Select Automation"
          data={automationOptions}
          value={automationId || null}
          onChange={(val) => {
            if (val) navigate(`/automations/${val}`);
            else navigate('/automations');
          }}
          disabled={!selectedProjectId}
          variant="filled"
          size="xs"
          styles={{
            input: { fontWeight: 500, width: 'auto', minWidth: '150px', backgroundColor: 'var(--mantine-color-zinc-8)' }
          }}
        />

      </Group>

      <Group gap="md" align="center">
        {(automationId || scheduleString) && (
          <Group gap="xs">
            {automationId && (
              <Badge variant="light" color="teal" size="sm" radius="sm">
                Active
              </Badge>
            )}
            {scheduleString && (
              <Badge leftSection={<IconCalendarEvent size={12} />} variant="light" color="violet" size="sm" radius="sm" style={{ textTransform: 'none' }}>
                {scheduleString}
              </Badge>
            )}
          </Group>
        )}

        <Group gap="xs">
          {onSave && (
            <AutomationSaveButton
              automationId={automationId}
              onSave={onSave}
              isSaving={isSaving}
              hasChanges={hasChanges}
              variant="icon"
            />
          )}
          <Tooltip label="Run Automation">
            <ActionIcon variant="light" color="primary" size="sm" radius="md" onClick={onRun} disabled={!automationId}>
              <IconPlayerPlay size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Flex>
  );
};

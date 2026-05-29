import React from 'react';
import { ActionIcon, Button, Menu, Tooltip } from '@mantine/core';
import { IconClock, IconPlayerPlay, IconChevronDown, IconEdit, IconTrash, IconCalendarOff, IconClockCancel } from '@tabler/icons-react';

export interface AutomationActionButtonProps {
  isScheduled: boolean;
  isActive: boolean;
  isRunning?: boolean;
  schedule?: string;
  onToggle: () => void;
  onRun: () => void;
  onScheduleClick?: () => void;
  onRemoveSchedule?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const AutomationActionButton: React.FC<AutomationActionButtonProps> = ({
  isScheduled,
  isActive,
  isRunning,
  schedule,
  onToggle,
  onRun,
  onScheduleClick,
  onRemoveSchedule,
  onEdit,
  onDelete,
}) => {
  const buttonText = isRunning ? "Running" : (isScheduled ? (schedule || "Scheduled") : "Run");
  const buttonVariant = isActive || !isScheduled ? "light" : "subtle";
  const buttonColor = isRunning ? "blue" : (isActive || !isScheduled ? "dark" : "gray");

  let tooltipLabel = isScheduled ? (isActive ? "Click to disable" : "Click to enable") : "Run manually";
  if (isRunning) tooltipLabel = "Automation is running...";

  return (
    <Button.Group className="action-btn">
      <Tooltip label={tooltipLabel} withArrow position="top">
        <Button
          variant={buttonVariant}
          color={buttonColor}
          size="compact-sm"
          loading={isRunning}
          loaderProps={{ type: 'dots' }}
          leftSection={!isRunning && (isScheduled ? (isActive ? <IconClock size={16} stroke={2} /> : <IconClockCancel size={16} />) : <IconPlayerPlay size={16} />)}
          onClick={(e) => {
            e.stopPropagation();
            if (isRunning) return;
            if (isScheduled) {
              onToggle();
            } else {
              onRun();
            }
          }}
          style={{ borderRight: '1px solid rgba(150, 150, 150, 0.2)', fontWeight: 500 }}
        >
          {buttonText}
        </Button>
      </Tooltip>
      <Menu position="bottom-end" withArrow={false} shadow="md" offset={3}>
        <Menu.Target>
          <ActionIcon
            variant={buttonVariant}
            color={buttonColor}
            size="sm"
            style={{ height: 26, width: 26, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          >
            <IconChevronDown size={14} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
          {!isActive && isScheduled && (
            <Menu.Item
              leftSection={<IconPlayerPlay size={14} stroke={1.5} />}
              onClick={onToggle}
              style={{ padding: '6px 12px', fontSize: 13, height: 32 }}
            >
              Activate
            </Menu.Item>
          )}
          {isScheduled && (
            <Menu.Item
              leftSection={<IconPlayerPlay size={14} stroke={1.5} />}
              onClick={onRun}
              style={{ padding: '6px 12px', fontSize: 13, height: 32 }}
            >
              Force Run
            </Menu.Item>
          )}
          <Menu.Item
            leftSection={<IconClock size={14} stroke={1.5} />}
            onClick={onScheduleClick}
            style={{ padding: '6px 12px', fontSize: 13, height: 32 }}
          >
            {isScheduled ? 'Edit Schedule' : 'Set Schedule'}
          </Menu.Item>
          {isScheduled && (
            <Menu.Item
              leftSection={<IconCalendarOff size={14} stroke={1.5} />}
              onClick={onRemoveSchedule}
              style={{ padding: '6px 12px', fontSize: 13, height: 32 }}
            >
              Turn to Manual
            </Menu.Item>
          )}
          <Menu.Item leftSection={<IconEdit size={14} stroke={1.5} />} style={{ padding: '6px 12px', fontSize: 13, height: 32 }} onClick={onEdit}>
            Edit Details
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item color="red" leftSection={<IconTrash size={14} stroke={1.5} />} style={{ padding: '6px 12px', fontSize: 13, height: 32 }} onClick={onDelete}>
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Button.Group>
  );
};

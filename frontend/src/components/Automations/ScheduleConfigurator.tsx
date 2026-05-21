import React, { useState } from 'react';
import { Stack, Group, Select, NumberInput, Text, Box } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import './ScheduleConfigurator.css';

export interface ScheduleConfig {
  frequency: 'hours' | 'days' | 'weeks' | 'months';
  interval: number;
  byDays?: string[]; // e.g. 'mon', 'tue'
  occurrences?: number | null;
  startDate?: Date | string | null;
  time?: string;
}

export interface ScheduleConfiguratorProps {
  value?: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
}

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 'sun' },
  { label: 'Mon', value: 'mon' },
  { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' },
  { label: 'Thu', value: 'thu' },
  { label: 'Fri', value: 'fri' },
  { label: 'Sat', value: 'sat' },
];

const DayPicker: React.FC<{ value: string[]; onChange: (val: string[]) => void }> = ({ value, onChange }) => {
  const toggleDay = (day: string) => {
    const next = value.includes(day) ? value.filter((d) => d !== day) : [...value, day];
    onChange(next);
  };

  return (
    <Group gap="xs">
      {DAYS_OF_WEEK.map((day) => {
        const isActive = value.includes(day.value);
        return (
          <Box
            key={day.value}
            onClick={() => toggleDay(day.value)}
            className={`day-circle ${isActive ? 'is-active' : ''}`}
          >
            {day.label.charAt(0)}
          </Box>
        );
      })}
    </Group>
  );
};

export const ScheduleConfigurator: React.FC<ScheduleConfiguratorProps> = ({ value, onChange }) => {
  const [config, setConfig] = useState<ScheduleConfig>(() => {
    if (!value) return { frequency: 'days', interval: 1, startDate: new Date() };
    return {
      ...value,
      startDate: value.startDate ? new Date(value.startDate) : null
    };
  });

  const updateConfig = (updates: Partial<ScheduleConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange(newConfig);
  };

  return (
    <Stack gap="xl" className="schedule-configurator">
      <Box>
        <Text size="sm" fw={500} mb="xs">Repeat Every</Text>
        <Group wrap="nowrap" align="center" gap="sm">
          <NumberInput
            value={config.interval}
            onChange={(val) => updateConfig({ interval: typeof val === 'number' ? val : 1 })}
            min={1}
            max={999}
            w={100}
            size="sm"
          />
          <Select
            value={config.frequency}
            onChange={(val) => updateConfig({ frequency: val as any })}
            data={[
              { value: 'hours', label: 'Hours' },
              { value: 'days', label: 'Days' },
              { value: 'weeks', label: 'Weeks' },
              { value: 'months', label: 'Months' },
            ]}
            size="sm"
            style={{ flex: 1 }}
          />
        </Group>
      </Box>

      {config.frequency === 'weeks' && (
        <Box>
          <Text size="sm" fw={500} mb="xs">Repeat On</Text>
          <DayPicker value={config.byDays || []} onChange={(days) => updateConfig({ byDays: days })} />
        </Box>
      )}

      <Box>
        <Text size="sm" fw={500} mb="xs">Starts On</Text>
        <Group wrap="nowrap" gap="sm">
          <DatePickerInput
            leftSection={<IconCalendar size={16} />}
            value={config.startDate ? new Date(config.startDate) : null}
            onChange={(val) => updateConfig({ startDate: val as Date | null })}
            placeholder="Pick date"
            size="sm"
            style={{ flex: 1 }}
          />
          <TimeInput
            leftSection={<IconClock size={16} />}
            value={config.time}
            onChange={(e) => updateConfig({ time: e.currentTarget.value })}
            size="sm"
            style={{ flex: 1 }}
          />
        </Group>
      </Box>

      <Box>
        <Text size="sm" fw={500} mb="xs">Ends</Text>
        <Group wrap="nowrap" align="center" gap="sm">
          <Select
            value={config.occurrences ? 'after' : 'never'}
            onChange={(val) => {
              if (val === 'never') updateConfig({ occurrences: null });
              if (val === 'after') updateConfig({ occurrences: 1 });
            }}
            data={[
              { value: 'never', label: 'Never' },
              { value: 'after', label: 'After occurrences' },
            ]}
            size="sm"
            w={160}
          />
          {config.occurrences !== null && config.occurrences !== undefined && (
            <NumberInput
              value={config.occurrences}
              onChange={(val) => updateConfig({ occurrences: typeof val === 'number' ? val : 1 })}
              min={1}
              max={999}
              size="sm"
              style={{ flex: 1 }}
              rightSection={<Text size="xs" c="dimmed" mr="xl">times</Text>}
            />
          )}
        </Group>
      </Box>
    </Stack>
  );
};

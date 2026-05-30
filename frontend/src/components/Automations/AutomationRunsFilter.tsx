import React from 'react';
import { Group, Select, ActionIcon } from '@mantine/core';
import { IconFilter, IconSortDescending, IconSortAscending } from '@tabler/icons-react';

export interface AutomationRunsFilterProps {
  statusFilter: string | null;
  onStatusChange: (value: string | null) => void;
  sortOrder: 'desc' | 'asc';
  onSortToggle: () => void;
}

export const AutomationRunsFilter: React.FC<AutomationRunsFilterProps> = ({
  statusFilter,
  onStatusChange,
  sortOrder,
  onSortToggle
}) => {
  return (
    <Group gap="xs" mb="xs">
      <Select 
        size="xs"
        value={statusFilter}
        onChange={onStatusChange}
        data={[
          { value: 'all', label: 'All Status' },
          { value: 'success', label: 'Success' },
          { value: 'error', label: 'Failed' },
          { value: 'running', label: 'Running' }
        ]}
        leftSection={<IconFilter size={12} />}
        style={{ flex: 1 }}
      />
      <ActionIcon 
        variant="default" 
        size={30} 
        onClick={onSortToggle}
        title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
      >
        {sortOrder === 'desc' ? <IconSortDescending size={16} /> : <IconSortAscending size={16} />}
      </ActionIcon>
    </Group>
  );
};

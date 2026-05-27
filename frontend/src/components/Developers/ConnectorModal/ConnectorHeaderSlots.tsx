import React from 'react';
import { Box, Group, TextInput, ActionIcon, Text, Stack } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

export interface HeaderSlot {
  key: string;
  placeholder: string;
}

interface ConnectorHeaderSlotsProps {
  slots: HeaderSlot[];
  onChange: (slots: HeaderSlot[]) => void;
}

export const ConnectorHeaderSlots: React.FC<ConnectorHeaderSlotsProps> = ({ slots, onChange }) => {
  const handleAddSlot = () => {
    onChange([...slots, { key: '', placeholder: '' }]);
  };

  const handleRemoveSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    onChange(newSlots);
  };

  const handleChange = (index: number, field: 'key' | 'placeholder', value: string) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    onChange(newSlots);
  };

  return (
    <Box>
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={600}>Header Fields</Text>
        <ActionIcon variant="light" color="blue" onClick={handleAddSlot} size="sm" title="Add Header">
          <IconPlus size={14} />
        </ActionIcon>
      </Group>

      {slots.length === 0 ? (
        <Text size="xs" c="dimmed">No header fields configured. Users will not be asked for specific connection headers.</Text>
      ) : (
        <Stack gap="xs">
          {slots.map((slot, index) => (
            <Group key={index} gap="sm" align="flex-start" wrap="nowrap">
              <TextInput
                placeholder="Header Name (e.g. Authorization)"
                value={slot.key}
                onChange={(e) => handleChange(index, 'key', e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder="Placeholder (e.g. Bearer YOUR_API_KEY)"
                value={slot.placeholder}
                onChange={(e) => handleChange(index, 'placeholder', e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <ActionIcon
                color="red"
                variant="subtle"
                onClick={() => handleRemoveSlot(index)}
                mt={4}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      )}
    </Box>
  );
};

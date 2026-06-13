import React from 'react';
import { Group, TextInput, Box, ThemeIcon, Text, Combobox, useCombobox, InputBase } from '@mantine/core';
import { IconSearch, IconFilter, IconCheck } from '@tabler/icons-react';
import { getSourceStyle } from '../sourceTypes';

interface SourceFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  availableTypes: string[];
}

export const SourceFilter: React.FC<SourceFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedTypes,
  onTypesChange,
  availableTypes,
}) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const handleValueSelect = (val: string) => {
    onTypesChange(
      selectedTypes.includes(val)
        ? selectedTypes.filter((v) => v !== val)
        : [...selectedTypes, val]
    );
  };

  const options = availableTypes.map((type) => {
    const styleInfo = getSourceStyle(type);
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    const isSelected = selectedTypes.includes(type);

    return (
      <Combobox.Option value={type} key={type} active={isSelected}>
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" color={styleInfo.color} size="sm">
            {styleInfo.icon}
          </ThemeIcon>
          <Text size="sm" truncate style={{ flex: 1 }}>{label}</Text>
          {isSelected && <IconCheck size={14} />}
        </Group>
      </Combobox.Option>
    );
  });

  let displayValue = 'Types';
  if (selectedTypes.length === 1) {
    displayValue = selectedTypes[0].charAt(0).toUpperCase() + selectedTypes[0].slice(1);
  } else if (selectedTypes.length > 1) {
    displayValue = `${selectedTypes.length} types`;
  }

  return (
    <Box pb="xs">
      <Group wrap="nowrap" align="flex-start" gap="xs">
        <TextInput
          placeholder="Search sources..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          leftSection={<IconSearch size={14} />}
          style={{ flex: 1 }}
          size="xs"
          radius="md"
        />

        <Combobox store={combobox} onOptionSubmit={handleValueSelect} withinPortal={false}>
          <Combobox.DropdownTarget>
            <InputBase
              component="button"
              type="button"
              pointer
              rightSection={<Combobox.Chevron />}
              leftSection={<IconFilter size={14} />}
              onClick={() => combobox.toggleDropdown()}
              size="xs"
              radius="md"
              w={130}
            >
              <Text size="xs" truncate>{displayValue}</Text>
            </InputBase>
          </Combobox.DropdownTarget>

          <Combobox.Dropdown>
            <Combobox.Options>
              {options.length > 0 ? options : <Combobox.Empty>No types</Combobox.Empty>}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
      </Group>
    </Box>
  );
};

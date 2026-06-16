import React, { useState, useEffect } from 'react';
import {
  Modal, TextInput, Textarea, Button, Group, Stack, Box, Title, Text,
  ActionIcon, Divider, Select, Table, ScrollArea, Tabs, TagsInput, ThemeIcon
} from '@mantine/core';
import {
  IconX, IconDeviceFloppy, IconLink, IconSettings, IconFileText,
  IconPlus, IconTrash, IconCheck
} from '@tabler/icons-react';
import { EntityState, Entity, EntityConnection } from '../../../api/library';
import { getSourceStyle } from './sourceTypes';
import './EditEntityModal.css';

interface EditEntityModalProps {
  opened: boolean;
  onClose: () => void;
  entity: Entity | null;
  onSave: (entityId: string, data: { type?: string; current_state: EntityState }) => Promise<void>;
  isLoading?: boolean;
}

const ENTITY_TYPES = [
  { value: 'person', label: 'Person' },
  { value: 'place', label: 'Place' },
  { value: 'concept', label: 'Concept' },
  { value: 'source', label: 'Source' },
  { value: 'product', label: 'Product' },
  { value: 'tool', label: 'Tool' },
  { value: 'company', label: 'Company' },
  { value: 'ip', label: 'IP Address' },
  { value: 'county', label: 'County' },
  { value: 'file', label: 'File' },
];

const renderSelectOption = ({ option, checked }: any) => {
  const styleInfo = getSourceStyle(option.value);
  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon variant="light" color={styleInfo.color} size="sm">
        {styleInfo.icon}
      </ThemeIcon>
      <Text size="sm" truncate style={{ flex: 1 }}>{option.label}</Text>
      {checked && <IconCheck size={14} />}
    </Group>
  );
};

export const EditEntityModal: React.FC<EditEntityModalProps> = ({
  opened,
  onClose,
  entity,
  onSave,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [connections, setConnections] = useState<EntityConnection[]>([]);
  const [sourceTools, setSourceTools] = useState<string[]>([]);

  // New connection state
  const [newConnId, setNewConnId] = useState('');
  const [newConnType, setNewConnType] = useState('');

  useEffect(() => {
    if (opened && entity) {
      const state = entity.current_state || { title: '', description: '', related_entities: [], source_tools: [] };
      setTitle(state.title || '');
      setDescription(state.description || '');
      setType(entity.type || '');
      setConnections(state.related_entities || []);
      setSourceTools(state.source_tools || []);
      setActiveTab('general');
      setNewConnId('');
      setNewConnType('');
    }
  }, [opened, entity]);

  const handleSave = async () => {
    if (!entity) return;

    await onSave(entity.id, {
      type,
      current_state: {
        title,
        description,
        related_entities: connections,
        source_tools: sourceTools,
      }
    });
    onClose();
  };

  const addConnection = () => {
    if (!newConnId.trim() || !newConnType.trim()) return;
    setConnections([...connections, { entity_id: newConnId, connection_type: newConnType }]);
    setNewConnId('');
    setNewConnType('');
  };

  const removeConnection = (index: number) => {
    setConnections(connections.filter((_, i) => i !== index));
  };

  if (!entity) return null;

  const sourceStyle = getSourceStyle(type || entity.type);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="xl"
      centered
      radius="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Box style={{ overflow: 'hidden' }}>
        <Stack gap="md">
          {/* Header */}
          <Box>
            <Group justify="space-between" align="flex-start" mb="sm">
              <Group align="baseline" gap="xs">
                <Title fw={300} order={5}>Edit</Title>
                <Title order={3}>
                  Source Configuration
                </Title>
              </Group>
              <ActionIcon variant="subtle" color="gray" onClick={onClose}>
                <IconX size={20} />
              </ActionIcon>
            </Group>

            <Group gap="5" mb="sm">
              <Button variant='light' size='xs' radius='xl' color={sourceStyle.color} leftSection={<Box c={sourceStyle.color} style={{ display: 'flex', alignItems: 'center' }}>
                {sourceStyle.icon}
              </Box>}>
                <Text size="sm" fw={500} c={sourceStyle.color} tt="uppercase">
                  {type || entity.type}
                </Text>
              </Button>
              <Text size="sm" c="dimmed">•</Text>
              <Text size="sm" c="dimmed">
                ID: {entity.id}
              </Text>
            </Group>
          </Box>

          <Tabs value={activeTab} onChange={setActiveTab} color="blue" variant="outline" radius="md">
            <Tabs.List>
              <Tabs.Tab value="general" leftSection={<IconFileText size={16} />}>
                General
              </Tabs.Tab>
              <Tabs.Tab
                value="connections"
                leftSection={<IconLink size={16} />}
                rightSection={
                  connections.length > 0 ? (
                    <ThemeIcon size="sm" variant="light" radius="xl">
                      {connections.length}
                    </ThemeIcon>
                  ) : undefined
                }
              >
                Connections
              </Tabs.Tab>
              <Tabs.Tab value="tools" leftSection={<IconSettings size={16} />}>
                Meta & Tools
              </Tabs.Tab>
            </Tabs.List>

            <ScrollArea h={400} offsetScrollbars type="auto" mt="md">
              <Tabs.Panel value="general" p="xs">
                <Stack gap="md">
                  <Select
                    label="Entity Type"
                    placeholder="Select entity type"
                    data={ENTITY_TYPES}
                    value={type}
                    onChange={(val) => setType(val || '')}
                    searchable
                    variant="filled"
                    size="md"
                    radius="md"
                    renderOption={renderSelectOption}
                  />
                  <TextInput
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value)}
                    placeholder="Entity title"
                    data-autofocus
                    variant="filled"
                    size="md"
                    radius="md"
                  />
                  <Textarea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.currentTarget.value)}
                    placeholder="Provide a comprehensive description..."
                    rows={8}
                    variant="filled"
                    size="md"
                    radius="md"
                    styles={{ input: { resize: 'vertical' } }}
                    classNames={{ input: 'editEntityTextarea' }}
                  />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="connections" p="xs">
                <Stack gap="md">
                  <Text size="sm" c="dimmed">
                    Manage relationships between this entity and other library items.
                  </Text>

                  <Box style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
                    <Table verticalSpacing="sm" striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Target Entity ID</Table.Th>
                          <Table.Th>Connection Type</Table.Th>
                          <Table.Th w={80}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {connections.length > 0 ? (
                          connections.map((conn, idx) => (
                            <Table.Tr key={idx}>
                              <Table.Td fw={500}>{conn.entity_id}</Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed">{conn.connection_type}</Text>
                              </Table.Td>
                              <Table.Td>
                                <ActionIcon color="red" variant="subtle" onClick={() => removeConnection(idx)}>
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Table.Td>
                            </Table.Tr>
                          ))
                        ) : (
                          <Table.Tr>
                            <Table.Td colSpan={3}>
                              <Text c="dimmed" ta="center" py="xl">No connections defined yet</Text>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Table.Tbody>
                    </Table>
                  </Box>

                  <Divider label="Add New Connection" labelPosition="center" my="sm" />

                  <Group align="flex-end" wrap="nowrap">
                    <TextInput
                      label="Entity ID"
                      placeholder="e.g. ent_123456"
                      value={newConnId}
                      onChange={(e) => setNewConnId(e.currentTarget.value)}
                      flex={1}
                    />
                    <TextInput
                      label="Relationship"
                      placeholder="e.g. mentioned_in, child_of"
                      value={newConnType}
                      onChange={(e) => setNewConnType(e.currentTarget.value)}
                      flex={1}
                    />
                    <Button
                      variant="light"
                      onClick={addConnection}
                      disabled={!newConnId.trim() || !newConnType.trim()}
                      leftSection={<IconPlus size={16} />}
                    >
                      Add
                    </Button>
                  </Group>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="tools" p="xs">
                <Stack gap="md">
                  <TagsInput
                    label="Source Tools"
                    description="Press Enter to add tools associated with this entity"
                    placeholder="e.g. text_extractor, pdf_parser"
                    value={sourceTools}
                    onChange={setSourceTools}
                    clearable
                    variant="filled"
                    size="md"
                    radius="md"
                  />
                </Stack>
              </Tabs.Panel>
            </ScrollArea>
          </Tabs>

          <Divider mt="sm" />

          <Group justify="space-between" mt="xs">
            <Button variant="subtle" color="gray" onClick={onClose} disabled={isLoading}>
              Discard Changes
            </Button>
            <Button
              onClick={handleSave}
              loading={isLoading}
              disabled={!title.trim()}
              leftSection={<IconDeviceFloppy size={18} />}
              radius="md"
              size="md"
            >
              Save Configuration
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
};

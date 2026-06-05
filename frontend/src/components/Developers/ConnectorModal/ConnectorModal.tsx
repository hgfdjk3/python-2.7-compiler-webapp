import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Group, Stack, Text, Box, Title, ColorInput, Popover, Input, ScrollArea, SimpleGrid, ActionIcon } from '@mantine/core';
import { IconPlugConnected, IconEdit, IconChevronDown } from '@tabler/icons-react';
import './ConnectorModal.css';
import { ConnectorFormData } from '../../../api/connectors';
import { ConnectorHeaderSlots, HeaderSlot } from './ConnectorHeaderSlots';
import { AGENT_ICON_MAP, getAgentIcon } from '../../../utils/iconUtils';

const UNIQUE_ICONS = (() => {
  const pairs: [string, any][] = [];
  const seen = new Set();
  Object.entries(AGENT_ICON_MAP).forEach(([k, V]) => {
    if (!seen.has(V)) {
      seen.add(V);
      pairs.push([k, V]);
    }
  });
  return pairs;
})();

interface ConnectorModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: ConnectorFormData) => void;
  initialData?: ConnectorFormData | null;
}

export const ConnectorModal: React.FC<ConnectorModalProps> = ({ opened, onClose, onSubmit, initialData }) => {
  const isEdit = !!initialData;

  const [formData, setFormData] = useState<ConnectorFormData>({
    id: '',
    name: '',
    url: '',
    color: '#3b82f6',
    icon: 'server',
    description: '',
    publisher_name: '',
    developers: []
  });
  const [developersStr, setDevelopersStr] = useState('');
  const [headerSlots, setHeaderSlots] = useState<HeaderSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened) {
      if (initialData) {
        setFormData(initialData);
        if (initialData.headers_schema) {
          setHeaderSlots(Object.entries(initialData.headers_schema).map(([key, placeholder]) => ({ key, placeholder })));
        } else if (initialData.headers) {
          // Fallback to older format
          setHeaderSlots(Object.entries(initialData.headers).map(([key, placeholder]) => ({ key, placeholder })));
        } else {
          setHeaderSlots([]);
        }
        setDevelopersStr(initialData.developers?.join(', ') || '');
      } else {
        setFormData({ id: '', name: '', url: '', color: '#3b82f6', icon: 'server', description: '', publisher_name: '', developers: [] });
        setHeaderSlots([]);
        setDevelopersStr('');
      }
      setLoading(false);
    }
  }, [opened, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Auto-generate ID if empty
    const submissionData = { ...formData };
    if (!submissionData.id) {
      submissionData.id = submissionData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || `conn-${Date.now()}`;
    }

    const validSlots = headerSlots.filter(s => s.key.trim() !== '');
    if (validSlots.length > 0) {
      submissionData.headers_schema = validSlots.reduce((acc, slot) => {
        acc[slot.key.trim()] = slot.placeholder.trim();
        return acc;
      }, {} as Record<string, string>);
    } else {
      submissionData.headers_schema = undefined;
    }

    // Clear out old headers format if it existed
    submissionData.headers = undefined;

    try {
      await onSubmit(submissionData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm" align="center">
          <Box className="modal-icon-wrapper">
            {isEdit ? <IconEdit size={18} /> : <IconPlugConnected size={18} />}
          </Box>
          <Box>
            <Title order={4} fw={600}>{isEdit ? 'Edit Connection' : 'New Connection'}</Title>
            <Text size="xs" c="dimmed" mt={2}>
              {isEdit ? 'Update your Model Context Protocol server.' : 'Connect a new Model Context Protocol server.'}
            </Text>
          </Box>
        </Group>
      }
      centered
      size="md"
      overlayProps={{ backgroundOpacity: 0.5, blur: 0 }}
      classNames={{ content: 'connector-modal', header: 'connector-modal-header', title: 'connector-modal-title' }}
      transitionProps={{ transition: 'pop', duration: 200 }}
    >
      <form onSubmit={handleSubmit} className="connector-modal-form">
        <Stack gap="xl">
          <Box className="form-section">
            <Text className="section-title">General</Text>
            <Stack gap="md">
              <TextInput
                label="Connection Name"
                placeholder="e.g., Internal Database Tools"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                data-autofocus
              />
              <Group grow align="flex-start">
                <ColorInput
                  label="Brand Color"
                  format="hex"
                  value={formData.color}
                  onChange={(val) => setFormData({ ...formData, color: val })}
                />
                <Input.Wrapper label="Icon" style={{ flex: 1 }}>
                  <Popover position="bottom-start" shadow="md">
                    <Popover.Target>
                      <Button
                        variant="default"
                        fullWidth
                        justify="space-between"
                        rightSection={<IconChevronDown size={14} opacity={0.5} />}
                        styles={{ inner: { flex: 1, justifyContent: 'flex-start' }, label: { overflow: 'hidden' } }}
                      >
                        <Group gap="sm" wrap="nowrap">
                          {getAgentIcon(formData.icon, { size: 16 })}
                          <Text size="sm" truncate style={{ textTransform: 'capitalize' }}>
                            {formData.icon || 'Select Icon'}
                          </Text>
                        </Group>
                      </Button>
                    </Popover.Target>
                    <Popover.Dropdown p="xs">
                      <ScrollArea.Autosize maxHeight={200}>
                        <SimpleGrid cols={6} spacing="xs">
                          {UNIQUE_ICONS.map(([key, IconComponent]) => (
                            <ActionIcon
                              key={key}
                              variant={formData.icon === key ? 'light' : 'subtle'}
                              color={formData.icon === key ? 'blue' : 'gray'}
                              onClick={() => setFormData({ ...formData, icon: key, color: formData.color })}
                              size="lg"
                            >
                              <IconComponent size={20} stroke={1.5} />
                            </ActionIcon>
                          ))}
                        </SimpleGrid>
                      </ScrollArea.Autosize>
                    </Popover.Dropdown>
                  </Popover>
                </Input.Wrapper>
              </Group>
              <TextInput
                label="Description"
                placeholder="Briefly describe what these tools do"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
              />
              <Group grow align="flex-start">
                <TextInput
                  label="Publisher Name"
                  placeholder="e.g., Acme Corp"
                  value={formData.publisher_name || ''}
                  onChange={(e) => setFormData({ ...formData, publisher_name: e.currentTarget.value })}
                />
                <TextInput
                  label="Developers"
                  placeholder="Comma-separated usernames"
                  value={developersStr}
                  onChange={(e) => {
                    setDevelopersStr(e.currentTarget.value);
                    setFormData({ ...formData, developers: e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean) });
                  }}
                />
              </Group>
            </Stack>
          </Box>

          <Box className="form-section">
            <Text className="section-title">Connection Details</Text>
            <Stack gap="md">
              <TextInput
                label="SSE Endpoint URL"
                placeholder="http://localhost:8000/sse"
                required
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.currentTarget.value })}
              />
              <ConnectorHeaderSlots
                slots={headerSlots}
                onChange={setHeaderSlots}
              />
            </Stack>
          </Box>

          <Group justify="flex-end" grow mt="md" className="modal-actions">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              {isEdit ? 'Save Changes' : 'Connect Server'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

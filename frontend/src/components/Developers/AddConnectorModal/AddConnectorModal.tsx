import React, { useState } from 'react';
import { Modal, TextInput, ColorInput, Button, Group, Stack, Text, Box, Textarea } from '@mantine/core';
import { IconPlugConnected, IconServer } from '@tabler/icons-react';
import './AddConnectorModal.css';
import { ConnectorFormData } from '../../../api/connectors';

interface AddConnectorModalProps {
  opened: boolean;
  onClose: () => void;
  onAdd: (data: ConnectorFormData) => void;
}

export const AddConnectorModal: React.FC<AddConnectorModalProps> = ({ opened, onClose, onAdd }) => {
  const [formData, setFormData] = useState<ConnectorFormData>({
    id: '',
    name: '',
    url: '',
    color: '#3B82F6',
    description: ''
  });
  const [headersText, setHeadersText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Auto-generate ID if empty
    const submissionData = { ...formData };
    if (!submissionData.id) {
      submissionData.id = submissionData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || `conn-${Date.now()}`;
    }

    if (headersText.trim()) {
      try {
        submissionData.headers = JSON.parse(headersText);
      } catch (err) {
        alert('Invalid JSON in Headers field. Please format as:\n{\n  "Authorization": "Bearer token"\n}');
        setLoading(false);
        return;
      }
    }

    try {
      await onAdd(submissionData);
      setFormData({ id: '', name: '', url: '', color: '#3B82F6', description: '' });
      setHeadersText('');
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
        <Group gap="sm">
          <IconPlugConnected size={20} color="#6366F1" />
          <Text fw={600}>Add Custom MCP Connection</Text>
        </Group>
      }
      centered
      size="md"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      classNames={{ content: 'add-connector-modal' }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Connect a remote Model Context Protocol (MCP) server dynamically via SSE transport.
          </Text>
          
          <TextInput
            label="Connection Name"
            placeholder="e.g., My Internal Tools"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
            data-autofocus
          />
          
          <TextInput
            label="SSE Endpoint URL"
            placeholder="http://localhost:8000/sse"
            required
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.currentTarget.value })}
          />
          
          <TextInput
            label="Description"
            placeholder="Briefly describe what these tools do"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
          />
          
          <Textarea
            label="Headers (JSON)"
            placeholder='{
  "Authorization": "Bearer your-token"
}'
            value={headersText}
            onChange={(e) => setHeadersText(e.currentTarget.value)}
            rows={3}
            styles={{ input: { fontFamily: 'monospace' } }}
          />
          
          <ColorInput
            label="Brand Color"
            format="hex"
            value={formData.color}
            onChange={(val) => setFormData({ ...formData, color: val })}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} color="indigo" leftSection={<IconServer size={16} />}>
              Connect Server
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Modal, Select, TextInput, Button, Group, Stack } from '@mantine/core';
import { useLibraryEntities, useCreateManualConnection } from '../../../../api/library';

interface CreateConnectionModalProps {
  projectId: string;
  sourceEntityId: string;
  targetEntityId?: string;
  opened: boolean;
  onClose: () => void;
}

export const CreateConnectionModal: React.FC<CreateConnectionModalProps> = ({
  projectId,
  sourceEntityId,
  targetEntityId,
  opened,
  onClose
}) => {
  const { data: entities } = useLibraryEntities(projectId);
  const { mutate: createConnection, isPending } = useCreateManualConnection(projectId);

  const [targetId, setTargetId] = useState<string | null>(targetEntityId || null);
  const [connectionType, setConnectionType] = useState('');

  // Prepare select options, excluding the source entity
  const selectOptions = (entities || [])
    .filter(e => e.id !== sourceEntityId)
    .map(e => {
      const state = e.current_state || e.proposed_state;
      return {
        value: e.id,
        label: state?.title || e.id
      };
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTargetId = targetEntityId || targetId;
    if (!finalTargetId || !connectionType.trim()) return;

    createConnection(
      {
        source_id: sourceEntityId,
        target_id: finalTargetId,
        connection_type: connectionType.trim()
      },
      {
        onSuccess: () => {
          setTargetId(null);
          setConnectionType('');
          onClose();
        }
      }
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Connection" centered zIndex={10000}>
      <form onSubmit={handleSubmit}>
        <Stack>
          {!targetEntityId && (
            <Select
              label="Target Node"
              placeholder="Select a node to connect to"
              data={selectOptions}
              value={targetId}
              onChange={setTargetId}
              searchable
              clearable
              required
              maxDropdownHeight={200}
            />
          )}
          <TextInput
            label="Connection Type"
            placeholder="e.g. relates to, works for, implies"
            value={connectionType}
            onChange={(e) => setConnectionType(e.currentTarget.value)}
            required
            autoFocus
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isPending}>Create Connection</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

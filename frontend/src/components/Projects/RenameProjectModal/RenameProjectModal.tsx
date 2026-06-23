import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Group } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useUpdateProject } from '../../../api/projects';

interface RenameProjectModalProps {
  opened: boolean;
  onClose: () => void;
  projectToRename: { id: string; name: string } | null;
}

export const RenameProjectModal: React.FC<RenameProjectModalProps> = ({
  opened,
  onClose,
  projectToRename,
}) => {
  const [newName, setNewName] = useState('');
  const updateProject = useUpdateProject();

  useEffect(() => {
    if (projectToRename) {
      setNewName(projectToRename.name);
    } else {
      setNewName('');
    }
  }, [projectToRename]);

  const handleRenameSubmit = () => {
    if (projectToRename && newName.trim()) {
      updateProject.mutate(
        { id: projectToRename.id, data: { name: newName.trim() } },
        {
          onSuccess: () => {
            onClose();
          }
        }
      );
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title="Rename Project"
    >
      <TextInput
        label="Project Name"
        placeholder="Enter new project name"
        value={newName}
        onChange={(e) => setNewName(e.currentTarget.value)}
        data-autofocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleRenameSubmit();
          }
        }}
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleRenameSubmit} 
          loading={updateProject.isPending}
          leftSection={<IconDeviceFloppy size={16} />}
        >
          Save
        </Button>
      </Group>
    </Modal>
  );
};

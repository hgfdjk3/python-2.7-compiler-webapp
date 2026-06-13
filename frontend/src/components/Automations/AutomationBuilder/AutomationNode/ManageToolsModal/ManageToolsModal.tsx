import React, { useState, useEffect } from 'react';
import { Modal, Text, Button, Group, Grid, Divider, Box } from '@mantine/core';
import { useAgentInfo } from '@/utils/agentUtils';
import { NodeToolsSection } from './NodeToolsSection';
import { AvailableToolsSection } from './AvailableToolsSection';
import '@/components/Project/Chat/PromptInput/ManageSourcesModal/ManageSourcesModal.css';

export interface ManageToolsModalProps {
  opened: boolean;
  onClose: () => void;
  currentTools: string[];
  onUpdateTools: (tools: string[]) => void;
}

export const ManageToolsModal: React.FC<ManageToolsModalProps> = ({ opened, onClose, currentTools, onUpdateTools }) => {
  const [draftTools, setDraftTools] = useState<string[]>([]);
  const { agents } = useAgentInfo();

  useEffect(() => {
    if (opened) {
      setDraftTools([...currentTools]);
    }
  }, [opened, currentTools]);

  const handleAdd = (tool: string) => {
    setDraftTools(prev => prev.includes(tool) ? prev : [...prev, tool]);
  };

  const handleRemove = (tool: string) => {
    setDraftTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : prev);
  };

  const handleSave = () => {
    onUpdateTools(draftTools);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">Manage Node Tools</Text>}
      size="1000px"
      centered
      classNames={{ header: 'nodrag manageSourcesHeader', body: 'nodrag manageSourcesBody' }}
      onMouseDownCapture={(e) => e.stopPropagation()}
    >
      <Group justify='center' wrap="nowrap" align='top'>
        <Box w="100%" h="100%">

          <NodeToolsSection
            draftTools={draftTools}
            agents={agents}
            onRemoveTool={handleRemove}
          />
        </Box>
        <Divider orientation="vertical" size="1px" />
        <Box w="100%" h="100%">
          <AvailableToolsSection
            draftTools={draftTools}
            agents={agents}
            onAddTool={handleAdd}
          />
        </Box>
      </Group>

      <Group justify="flex-end" pt="lg" style={{ borderTop: '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))' }}>
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </Group>
    </Modal>
  );
};

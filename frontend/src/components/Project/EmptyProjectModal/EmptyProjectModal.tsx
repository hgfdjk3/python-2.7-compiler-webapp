import React, { useState, useEffect } from 'react';
import { Modal, Box, Group, Button, Stack, Text, Title, ThemeIcon } from '@mantine/core';
import { IconMessage, IconBolt } from '@tabler/icons-react';
import { useProjectConversations } from '../../../api/conversations';
import { useChatStore } from '../../../store/chatStore';
import './EmptyProjectModal.css';

interface EmptyProjectModalProps {
  projectId: string;
}

export const EmptyProjectModal: React.FC<EmptyProjectModalProps> = ({ projectId }) => {
  const [opened, setOpened] = useState(false);
  const { data: conversations, isLoading } = useProjectConversations(projectId);
  const setIsAutomationMode = useChatStore((state) => state.setIsAutomationMode);

  useEffect(() => {
    if (!isLoading && conversations && conversations.length === 0) {
      // A slight delay ensures the component has mounted in the DOM with opened=false
      // before it flips to true, which is required for Mantine to trigger the enter animation.
      const timer = setTimeout(() => {
        setOpened(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading, conversations]);

  const handleClose = () => {
    setOpened(false);
  };

  const handleChat = () => {
    setIsAutomationMode(false);
    handleClose();
  };

  const handleAutomation = () => {
    setIsAutomationMode(true);
    handleClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={true}
      size="xl"
      centered
      radius="xl"
      padding="xl"
      classNames={{
        content: 'empty-project-modal-content',
        header: 'empty-project-modal-header'
      }}
      transitionProps={{ transition: 'pop', duration: 300 }}
    >
      <Box className="empty-project-modal-container">
        <Stack gap="xl" align="center" mt="md" mb="xl">
          <Box style={{ textAlign: 'center' }}>
            <Title order={2} size="h3" fw={600} mb="xs">
              Welcome to your new project!
            </Title>
            <Text c="dimmed" size="sm">
              How would you like to get started? Choose an option below.
            </Text>
          </Box>

          <Group grow w="100%" gap="md" align="stretch">
            <Button
              className="empty-project-option-card"
              variant="default"
              onClick={handleChat}
              h="auto"
              p="xl"
              radius="md"
            >
              <Stack align="center" gap="xs">
                <ThemeIcon size={64} radius="100%" variant="light" color="blue">
                  <IconMessage size={32} stroke={1.5} />
                </ThemeIcon>
                <Text fw={600} size="lg" mt="sm">Regular Conversation</Text>
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.5 }}>
                  Ask questions, generate content, and interact with your project sources.
                </Text>
              </Stack>
            </Button>

            <Button
              className="empty-project-option-card"
              variant="default"
              onClick={handleAutomation}
              h="auto"
              p="xl"
              radius="md"
            >
              <Stack align="center" gap="xs">
                <ThemeIcon size={64} radius="100%" variant="light" color="orange">
                  <IconBolt size={32} stroke={1.5} />
                </ThemeIcon>
                <Text fw={600} size="lg" mt="sm">Create Automation</Text>
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.5 }}>
                  Build automated workflows and complex multi-step reasoning chains.
                </Text>
              </Stack>
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
};

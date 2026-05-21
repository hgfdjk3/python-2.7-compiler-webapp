import React, { useState } from 'react';
import { 
  Stack, 
  Title, 
  TextInput, 
  Textarea, 
  Button, 
  Group, 
  Container, 
  Text,
  ActionIcon,
  rem
} from '@mantine/core';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import './NewProjectView.css';

interface NewProjectViewProps {}

export const NewProjectView: React.FC<NewProjectViewProps> = ({}) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    console.log('Creating project:', { name, description });
    // In a real app, this would be an API call
    navigate('/projects');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="new-project-view"
    >
      <Container size="sm" py={rem(80)}>
        <Stack gap="xl">
          <Group justify="space-between" align="center">
            <Group gap="md">
              <ActionIcon 
                variant="subtle" 
                color="gray" 
                onClick={() => navigate('/projects')}
                size="lg"
                radius="md"
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Title order={1} className="new-project-title">
                New Project
              </Title>
            </Group>
          </Group>

          <Text c="dimmed" size="sm" className="new-project-description-text">
            Create a new workspace to organize your chats, sources, and automations.
          </Text>

          <Stack gap="lg" className="new-project-form">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TextInput
                label="Project Name"
                placeholder="e.g. My Awesome Project"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                size="md"
                radius="md"
                autoFocus
                classNames={{
                  label: 'form-label',
                  input: 'form-input'
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Textarea
                label="Description"
                placeholder="Briefly describe what this project is about..."
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                size="md"
                radius="md"
                minRows={4}
                classNames={{
                  label: 'form-label',
                  input: 'form-input'
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Group justify="flex-end" mt="xl">
                <Button 
                  variant="subtle" 
                  color="gray" 
                  onClick={() => navigate('/projects')}
                  radius="md"
                  size="md"
                >
                  Cancel
                </Button>
                <Button
                  leftSection={<IconCheck size={18} />}
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  radius="md"
                  size="md"
                  className="create-button"
                >
                  Create Project
                </Button>
              </Group>
            </motion.div>
          </Stack>
        </Stack>
      </Container>
    </motion.div>
  );
};

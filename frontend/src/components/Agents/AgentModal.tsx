import React from 'react';
import { Modal, Text, Group, Button, Badge, ThemeIcon, Stack, Box, Title, SimpleGrid, Divider, Spoiler } from '@mantine/core';
import { motion, AnimatePresence } from 'motion/react';
import { IconDatabase, IconTool, IconExternalLink } from '@tabler/icons-react';
import { AgentInfo } from '../../utils/agentUtils';
import './AgentModal.css';

interface AgentModalProps {
  agent: AgentInfo | null;
  status: 'enabled' | 'disabled';
  opened: boolean;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({
  agent,
  status,
  opened,
  onClose,
  onToggleStatus
}) => {
  if (!agent) return null;

  const isEnabled = status === 'enabled';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="md"
      centered
      radius="xl"
      padding={0}
      className="agent-modal"
    >
      <Box style={{ '--agent-modal-brand-color': agent.brandColor } as React.CSSProperties}>
        <Group justify='space-between' align='center' className="agent-modal-hero" gap="xl">
          <Stack gap={4} style={{ flex: 1 }}>
            <Title
              order={2}
              className="agent-modal-title"
              style={{ marginBottom: 0, textAlign: 'left' }}
            >
              {agent.name}
            </Title>
            <Group gap={12}>
              <Group gap={4}>
                <Text size="xs" fw={700} c="zinc.5" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Verified
                </Text>
                <Divider orientation="vertical" h={10} color="zinc.7" />
                <Text size="xs" fw={600} c="zinc.4">
                  by {agent.developer}
                </Text>
              </Group>
              <Divider orientation="vertical" h={14} color="zinc.8" />
              <Group gap={6}>
                <IconTool size={14} color="var(--mantine-color-zinc-5)" />
                <Text size="xs" fw={700} c="zinc.4">
                  {agent.toolsEnabled.length} Tools
                </Text>
              </Group>
            </Group>
          </Stack>

          <div className="agent-modal-icon-wrapper">
            <motion.div
              className="agent-modal-icon-aura"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 0.8, 0.6]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div className="agent-modal-icon-inner">
              {React.cloneElement(agent.icon as React.ReactElement<any>, { size: 32, stroke: 1.5 })}
            </div>
          </div>
        </Group>

        <Stack gap="xl" p="md">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Stack gap="5">
              <Text fw={700} lh={1} size="md" >
                Description
              </Text>
              <Spoiler styles={{
                control: {
                  fontSize: 'var(--mantine-font-size-xs)',
                  fontWeight: 500,
                  display: 'inline',
                }
              }} maxHeight={50} showLabel="Show More" hideLabel="Show Less">
                <Text size="xs" c="zinc.3" >
                  {agent.description}
                </Text>
              </Spoiler>
            </Stack>
          </motion.div>

          <Stack gap="md">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Group justify="space-between" mb="sm" px={4}>
                <Group gap={6}>
                  <Text fw={700} lh={1} size="md">
                    Sources
                  </Text>
                  <Text size="10px" fw={800} c="zinc.5" bg="zinc.8" px={6} py={1} style={{ borderRadius: 10 }}>
                    {agent.sourcesAdded.length}
                  </Text>
                </Group>
              </Group>

              <Group gap="xs">
                {agent.sourcesAdded.map((source) => (
                  <Box
                    key={source}
                    className="agent-modal-source-card"
                    style={{ '--source-color': agent.brandColor } as React.CSSProperties}
                  >
                    <Text size="xs" fw={700} c="zinc.2">
                      {source}
                    </Text>
                  </Box>
                ))}
              </Group>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Stack gap="xs" px={4}>
                <Text fw={700} lh={1} size="md">
                  Developer
                </Text>
                <Group justify="space-between" align="center">
                  <Text size="xs" fw={600} c="zinc.4">{agent.developer}</Text>
                  <Group gap={4}>
                    {(agent.developerWebsite || agent.developerSupport) && (
                      <Button
                        component="a"
                        href={agent.developerWebsite || agent.developerSupport}
                        target="_blank"
                        variant="subtle"
                        color="zinc.5"
                        size="compact-xs"
                        rightSection={<IconExternalLink size={12} />}
                      >
                        Visit Website
                      </Button>
                    )}
                  </Group>
                </Group>
              </Stack>
            </motion.div>
          </Stack>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Group grow justify="flex-end" mt="md" gap="sm">
              <Button
                variant="subtle"
                color="zinc.5"
                size="sm"
                onClick={onClose}
                fw={500}
                px="md"
              >
                Cancel
              </Button>
              <Button
                variant={isEnabled ? "outline" : "filled"}
                className="agent-modal-button"
                radius="md"
                size="sm"
                px="md"
                style={!isEnabled ? {
                  background: `linear-gradient(135deg, ${agent.brandColor}, color-mix(in srgb, ${agent.brandColor}, black 30%))`,
                  border: 0,
                  height: 40
                } : { height: 40 }}
                onClick={() => {
                  onToggleStatus(agent.id);
                  onClose();
                }}
              >
                {isEnabled ? "Disable Connector" : "Enable Connector"}
              </Button>
            </Group>
          </motion.div>
        </Stack>
      </Box>
    </Modal>
  );
};


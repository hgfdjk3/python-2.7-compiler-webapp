import React from 'react';
import { Modal, Text, Group, Button, Badge, ThemeIcon, Stack, Box, Title, SimpleGrid, Divider, Spoiler, TextInput } from '@mantine/core';
import { motion, AnimatePresence } from 'motion/react';
import { IconDatabase, IconTool, IconExternalLink } from '@tabler/icons-react';
import { AgentInfo } from '../../utils/agentUtils';
import { getAgentIcon } from '../../utils/iconUtils';
import { AgentConfigurationForm } from '../AgentConfiguration/AgentConfigurationForm';
import { AgentToolsList } from '../AgentToolsList/AgentToolsList';
import './AgentModal.css';

interface AgentModalProps {
  agent: AgentInfo | null;
  status: 'enabled' | 'disabled';
  opened: boolean;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  onUpdateConfig?: (id: string, header_values: Record<string, string>) => Promise<void>;
}

export const AgentModal: React.FC<AgentModalProps> = ({
  agent,
  status,
  opened,
  onClose,
  onToggleStatus,
  onUpdateConfig
}) => {
  const [showConfig, setShowConfig] = React.useState(false);
  const [headerValues, setHeaderValues] = React.useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (opened && agent) {
      setShowConfig(false);
      setHeaderValues(agent.header_values || {});
    }
  }, [opened, agent]);

  if (!agent) return null;

  const isEnabled = status === 'enabled';
  const hasSchema = agent.headers_schema && Object.keys(agent.headers_schema).length > 0;

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
              {getAgentIcon(agent.iconName || agent.name, { size: 32, stroke: 1.5 })}
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
              <Stack gap="xs" px={4}>
                <Text fw={700} lh={1} size="md">
                  Connection Details
                </Text>
                <SimpleGrid cols={2} spacing="sm">
                  <Box>
                    <Text size="xs" c="zinc.4" fw={500}>Visibility</Text>
                    <Group gap="xs" mt={4}>
                      <Badge variant="light" size='xs' color={agent.public ? agent.brandColor : "zinc.6"}>
                        {agent.public ? "Public" : "Private"}
                      </Badge>
                    </Group>
                  </Box>
                  {agent.creator && (
                    <Box>
                      <Text size="xs" c="zinc.4" fw={500}>Creator</Text>
                      <Text size="xs" fw={600}>{agent.creator}</Text>
                    </Box>
                  )}
                </SimpleGrid>
              </Stack>
            </motion.div>

            {agent.tags && agent.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Stack gap="xs" px={4}>
                  <Text fw={700} lh={1} size="md">
                    Tags
                  </Text>
                  <Group gap="xs">
                    {agent.tags.map((tag) => (
                      <Badge key={tag} variant="outline" color="zinc.4" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Box px={4}>
                <AgentToolsList tools={agent.toolsEnabled} brandColor={agent.brandColor} />
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
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

          <AnimatePresence mode="wait">
            {showConfig && hasSchema ? (
              <motion.div
                key="config"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <AgentConfigurationForm
                  schema={agent.headers_schema || {}}
                  values={headerValues}
                  onChange={(key, value) => setHeaderValues(prev => ({ ...prev, [key]: value }))}
                  brandColor={agent.brandColor}
                  isEditing={isEnabled}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Group grow justify="flex-end" mt="md" gap="sm">
              {isEnabled && !showConfig ? (
                <>
                  <Button variant="subtle" color="zinc.5" onClick={onClose} size="sm">Close</Button>
                  <Button variant="outline" onClick={() => { onToggleStatus(agent.id); onClose(); }} size="sm">Disable Connector</Button>
                  {hasSchema && (
                    <Button
                      variant="filled"
                      onClick={() => setShowConfig(true)}
                      size="sm"
                      color={agent.brandColor}
                    >
                      Edit Configuration
                    </Button>
                  )}
                </>
              ) : isEnabled && showConfig ? (
                <>
                  <Button variant="subtle" color="zinc.5" onClick={() => setShowConfig(false)} size="sm">Cancel</Button>
                  <Button
                    variant="filled"
                    loading={isUpdating}
                    size="sm"
                    color={agent.brandColor}
                    onClick={async () => {
                      if (onUpdateConfig) {
                        setIsUpdating(true);
                        try {
                          await onUpdateConfig(agent.id, headerValues);
                          setShowConfig(false);
                        } finally {
                          setIsUpdating(false);
                        }
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </>
              ) : !isEnabled && showConfig ? (
                <>
                  <Button variant="subtle" color="zinc.5" onClick={() => setShowConfig(false)} size="sm">Back</Button>
                  <Button
                    variant="filled"
                    loading={isUpdating}
                    size="sm"
                    color={agent.brandColor}
                    onClick={async () => {
                      if (onUpdateConfig) {
                        setIsUpdating(true);
                        try {
                          await onUpdateConfig(agent.id, headerValues);
                          onToggleStatus(agent.id);
                          onClose();
                        } finally {
                          setIsUpdating(false);
                        }
                      } else {
                        onToggleStatus(agent.id);
                        onClose();
                      }
                    }}
                  >
                    Save & Enable
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="subtle" color="zinc.5" onClick={onClose} size="sm">Cancel</Button>
                  <Button
                    variant="filled"
                    size="sm"
                    color={agent.brandColor}
                    onClick={() => {
                      if (hasSchema) {
                        setShowConfig(true);
                      } else {
                        onToggleStatus(agent.id);
                        onClose();
                      }
                    }}
                  >
                    Enable Connector
                  </Button>
                </>
              )}
            </Group>
          </motion.div>
        </Stack>
      </Box>
    </Modal>
  );
};


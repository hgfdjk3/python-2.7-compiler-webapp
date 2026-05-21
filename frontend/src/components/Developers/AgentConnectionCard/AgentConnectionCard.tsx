import React, { useState } from 'react';
import {
  Box,
  Text,
  Group,
  Stack,
  ThemeIcon,
  Badge,
  ActionIcon,
  Tooltip,
  CopyButton,
  Code,
  Divider,
} from '@mantine/core';
import {
  IconCopy,
  IconCheck,
  IconRefresh,
  IconKey,
  IconActivity,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { AgentInfo } from '../../../utils/agentUtils';
import { AgentUsageChart } from '../AgentUsageChart/AgentUsageChart';
import { motion, AnimatePresence } from 'motion/react';
import './AgentConnectionCard.css';

interface AgentConnectionCardProps {
  agent: AgentInfo;
  status: 'enabled' | 'disabled';
}

const generateToken = () => `atm_${Math.random().toString(36).slice(2, 10)}_${Math.random().toString(36).slice(2, 18)}`;

const MOCK_USAGE_DATA = Array.from({ length: 14 }, (_, i) => ({
  name: `D-${14 - i}`,
  value: Math.floor(Math.random() * 180 + 20),
  secondary: Math.floor(Math.random() * 60 + 5),
}));

export const AgentConnectionCard: React.FC<AgentConnectionCardProps> = ({ agent, status }) => {
  const [token, setToken] = useState(generateToken());
  const [showToken, setShowToken] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerateToken = () => {
    setRegenerating(true);
    setTimeout(() => {
      setToken(generateToken());
      setRegenerating(false);
    }, 600);
  };

  const maskedToken = token.replace(/(?<=atm_\w{8}_).+/, (m) => '•'.repeat(m.length));

  const totalRequests = MOCK_USAGE_DATA.reduce((s, d) => s + d.value, 0);
  const avgRequests = Math.round(totalRequests / MOCK_USAGE_DATA.length);

  return (
    <motion.div
      className={`agent-conn-card ${status === 'enabled' ? 'agent-conn-card--enabled' : ''}`}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ '--agent-color': agent.brandColor } as React.CSSProperties}
    >
      {/* Color accent strip */}
      <div className="agent-conn-strip" />

      <Box p="lg">
        {/* Header row */}
        <Group justify="space-between" wrap="nowrap" mb="md">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon
              size={44}
              radius="md"
              variant="light"
              color="gray"
              className="agent-conn-icon"
            >
              {agent.icon}
            </ThemeIcon>
            <Stack gap={2}>
              <Group gap="xs">
                <Text fw={700} size="sm">
                  {agent.name}
                </Text>
                <Badge
                  size="xs"
                  variant={status === 'enabled' ? 'filled' : 'outline'}
                  color={status === 'enabled' ? 'teal' : 'gray'}
                  className={status === 'enabled' ? 'agent-conn-badge-pulse' : ''}
                >
                  {status === 'enabled' ? 'Active' : 'Inactive'}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                {agent.category} · by {agent.developer}
              </Text>
            </Stack>
          </Group>

          <Group gap="xs">
            <Tooltip label="View details" withArrow>
              <ActionIcon variant="subtle" color="gray" size="sm">
                <IconInfoCircle size={15} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <IconChevronUp size={15} stroke={1.5} />
              ) : (
                <IconChevronDown size={15} stroke={1.5} />
              )}
            </ActionIcon>
          </Group>
        </Group>

        {/* Description */}
        <Text size="xs" c="dimmed" lh={1.6} mb="md" lineClamp={expanded ? undefined : 2}>
          {agent.description}
        </Text>

        {/* Stats row */}
        <Group gap="xl" mb="md">
          <Stack gap={0}>
            <Text size="xl" fw={800} lh={1}>
              {totalRequests.toLocaleString()}
            </Text>
            <Text size="xs" c="dimmed">
              Total requests (14d)
            </Text>
          </Stack>
          <Stack gap={0}>
            <Text size="xl" fw={800} lh={1}>
              {avgRequests}
            </Text>
            <Text size="xs" c="dimmed">
              Avg / day
            </Text>
          </Stack>
          <Stack gap={0}>
            <Group gap={4} align="center">
              <Box className="status-dot status-dot--ok" />
              <Text size="xl" fw={800} lh={1}>
                99.8%
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Uptime
            </Text>
          </Stack>
        </Group>

        {/* Mini chart */}
        <AgentUsageChart data={MOCK_USAGE_DATA} color={agent.brandColor} />

        {/* Expandable section */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <Divider my="md" color="var(--mantine-color-default-border)" />

              {/* Sources & Tools */}
              <Group gap="xl" mb="md" align="flex-start">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.5px' }}>
                    Connected Sources
                  </Text>
                  <Group gap="xs">
                    {agent.sourcesAdded.map((s) => (
                      <Badge key={s} size="xs" variant="light" color="violet">
                        {s}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.5px' }}>
                    Enabled Tools
                  </Text>
                  <Group gap="xs">
                    {agent.toolsEnabled.map((t) => (
                      <Badge key={t} size="xs" variant="light" color="teal">
                        {t}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              </Group>

              {/* API Token */}
              <Stack gap="xs">
                <Group gap="xs">
                  <IconKey size={13} stroke={1.5} color="var(--mantine-color-dimmed)" />
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.5px' }}>
                    API Token
                  </Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Code
                    fz="xs"
                    className="agent-token-code"
                    onClick={() => setShowToken((v) => !v)}
                  >
                    {showToken ? token : maskedToken}
                  </Code>
                  <Group gap={4} style={{ flexShrink: 0 }}>
                    <Tooltip label={showToken ? 'Hide token' : 'Reveal token'} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="xs"
                        onClick={() => setShowToken((v) => !v)}
                      >
                        <IconActivity size={13} stroke={1.5} />
                      </ActionIcon>
                    </Tooltip>
                    <CopyButton value={token} timeout={1800}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copied!' : 'Copy token'} withArrow>
                          <ActionIcon
                            variant="subtle"
                            color={copied ? 'teal' : 'gray'}
                            size="xs"
                            onClick={copy}
                          >
                            {copied ? (
                              <IconCheck size={13} stroke={1.5} />
                            ) : (
                              <IconCopy size={13} stroke={1.5} />
                            )}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                    <Tooltip label="Regenerate token" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="xs"
                        onClick={handleRegenerateToken}
                        loading={regenerating}
                      >
                        <IconRefresh size={13} stroke={1.5} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
};

import React, { useState } from 'react';
import {
  Box,
  Text,
  Group,
  Stack,
  ThemeIcon,
  Badge,
  ActionIcon,
  CopyButton,
  Tooltip,
  Collapse,
  Code,
} from '@mantine/core';
import {
  IconCopy,
  IconCheck,
  IconRefresh,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { AgentInfo } from '../../../utils/agentUtils';
import { AgentUsageChart } from '../AgentUsageChart/AgentUsageChart';
import { motion, AnimatePresence } from 'motion/react';
import './AgentRow.css';

interface AgentRowProps {
  agent: AgentInfo;
  status: 'enabled' | 'disabled';
  delay?: number;
}

const generateToken = () =>
  `atm_${Math.random().toString(36).slice(2, 10)}_${Math.random().toString(36).slice(2, 18)}`;

const MOCK_DATA = Array.from({ length: 14 }, () => ({
  name: '',
  value: Math.floor(Math.random() * 160 + 20),
}));

export const AgentRow: React.FC<AgentRowProps> = ({ agent, status, delay = 0 }) => {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(generateToken());
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setToken(generateToken());
      setRegenerating(false);
    }, 600);
  };

  const totalReqs = MOCK_DATA.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      className={`agent-row ${open ? 'agent-row--open' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      style={{ '--agent-color': agent.brandColor } as React.CSSProperties}
    >
      {/* Main row */}
      <Box
        className="agent-row-main"
        onClick={() => setOpen((v) => !v)}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon size={36} radius="md" variant="light" color="gray" className="agent-row-icon">
              {agent.icon}
            </ThemeIcon>
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Group gap="xs">
                <Text size="sm" fw={600} truncate>
                  {agent.name}
                </Text>
                <Badge
                  size="xs"
                  variant={status === 'enabled' ? 'dot' : 'outline'}
                  color={status === 'enabled' ? 'teal' : 'gray'}
                >
                  {status === 'enabled' ? 'Active' : 'Inactive'}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" truncate>
                {agent.category}
              </Text>
            </Stack>
          </Group>

          <Group gap="lg" wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* Mini chart — only active */}
            {status === 'enabled' && (
              <Box w={80} style={{ flexShrink: 0 }}>
                <AgentUsageChart data={MOCK_DATA} color={agent.brandColor} height={32} />
              </Box>
            )}

            <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
              <Text size="sm" fw={700} lh={1}>
                {status === 'enabled' ? totalReqs.toLocaleString() : '—'}
              </Text>
              <Text size="xs" c="dimmed">
                14d reqs
              </Text>
            </Stack>

            <ActionIcon variant="subtle" color="gray" size="sm">
              {open ? <IconChevronUp size={14} stroke={1.5} /> : <IconChevronDown size={14} stroke={1.5} />}
            </ActionIcon>
          </Group>
        </Group>
      </Box>

      {/* Expanded detail */}
      <Collapse expanded={open}>
        <Box className="agent-row-detail">
          <Group align="flex-start" gap="xl" wrap="wrap">
            {/* Sources */}
            <Stack gap={6} style={{ flex: 1, minWidth: 140 }}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                Sources
              </Text>
              <Group gap="xs">
                {agent.sourcesAdded.map((s) => (
                  <Badge key={s} size="xs" variant="light" color="violet">
                    {s}
                  </Badge>
                ))}
              </Group>
            </Stack>

            {/* Tools */}
            <Stack gap={6} style={{ flex: 1, minWidth: 140 }}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                Tools
              </Text>
              <Group gap="xs">
                {agent.toolsEnabled.map((t) => (
                  <Badge key={t} size="xs" variant="light" color="teal">
                    {t}
                  </Badge>
                ))}
              </Group>
            </Stack>

            {/* Token */}
            {status === 'enabled' && (
              <Stack gap={6} style={{ flex: 2, minWidth: 200 }}>
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                  API Token
                </Text>
                <Group gap="xs" wrap="nowrap">
                  <Code fz={11} className="agent-row-token">
                    {token.slice(0, 24)}••••••••
                  </Code>
                  <CopyButton value={token} timeout={1800}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied!' : 'Copy'} withArrow>
                        <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} size="xs" onClick={copy}>
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                  <Tooltip label="Regenerate" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="xs"
                      onClick={handleRegenerate}
                      loading={regenerating}
                    >
                      <IconRefresh size={12} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Stack>
            )}
          </Group>
        </Box>
      </Collapse>
    </motion.div>
  );
};

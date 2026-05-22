import React, { useState } from 'react';
import {
  Box,
  Text,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Collapse,
  Button,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconServer,
  IconDatabase,
  IconCloud,
  IconApi,
  IconTerminal2,
  IconEdit,
  IconTrash
} from '@tabler/icons-react';
import { ConnectorFormData } from '../../../api/connectors';
import { AgentUsageChart } from '../AgentUsageChart/AgentUsageChart';
import './ConnectorRow.css';

interface ConnectorRowProps {
  connector: ConnectorFormData;
  onEdit: (connector: ConnectorFormData) => void;
  onDelete: (id: string) => void;
}

const MOCK_DATA = Array.from({ length: 14 }, () => ({
  name: '',
  value: Math.floor(Math.random() * 160 + 20),
}));

export const ConnectorRow: React.FC<ConnectorRowProps> = ({ connector, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);

  const totalReqs = MOCK_DATA.reduce((s, d) => s + d.value, 0);

  const getIcon = () => {
    const size = 20;
    const stroke = 1.5;
    switch (connector.icon) {
      case 'database': return <IconDatabase size={size} stroke={stroke} />;
      case 'cloud': return <IconCloud size={size} stroke={stroke} />;
      case 'api': return <IconApi size={size} stroke={stroke} />;
      case 'terminal': return <IconTerminal2 size={size} stroke={stroke} />;
      default: return <IconServer size={size} stroke={stroke} />;
    }
  };

  // Convert hex to rgba for the subtle background
  const hexToRgba = (hex: string, alpha: number) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const brandColor = connector.color || '#3b82f6';
  const iconBg = hexToRgba(brandColor, 0.15);

  return (
    <Box className="connector-row">
      {/* Main row */}
      <Box
        className="connector-row-main"
        onClick={() => setOpen((v) => !v)}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Box 
              className="connector-row-icon"
              style={{ backgroundColor: iconBg, color: brandColor, borderColor: hexToRgba(brandColor, 0.2) }}
            >
              {getIcon()}
            </Box>
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="sm" fw={600} truncate>
                {connector.name}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {connector.description || 'Dynamic MCP Connection'}
              </Text>
            </Stack>
          </Group>

          <Group gap="lg" wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* Usage Chart */}
            <Box w={80} style={{ flexShrink: 0 }}>
              <AgentUsageChart data={MOCK_DATA} color={brandColor} height={32} />
            </Box>

            <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
              <Text size="sm" fw={700} lh={1}>
                {totalReqs.toLocaleString()}
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
        <Box className="connector-row-detail">
          
          <Stack gap="xl" mt="xs">
            
            <Group justify="space-between" align="flex-start">
              {/* Configuration */}
              <Stack gap={8} style={{ flex: 1, minWidth: 200, maxWidth: '60%' }}>
                <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.5px' }}>
                  Configuration
                </Text>
                <Group gap="xs" wrap="nowrap">
                  <Text size="xs" fw={600} c="dimmed">URL:</Text>
                  <Text size="xs" ff="monospace">{connector.url}</Text>
                </Group>
                
                {connector.headers && Object.keys(connector.headers).length > 0 && (
                  <Group gap="xs" wrap="nowrap" align="flex-start" mt={4}>
                    <Text size="xs" fw={600} c="dimmed">Headers:</Text>
                    <Group gap={4}>
                      {Object.keys(connector.headers).map(key => (
                        <Badge key={key} size="xs" variant="outline" color="gray">
                          {key}
                        </Badge>
                      ))}
                    </Group>
                  </Group>
                )}
              </Stack>

              {/* Actions */}
              <Group gap="sm">
                <Button
                  variant="default"
                  size="xs"
                  leftSection={<IconEdit size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(connector);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  leftSection={<IconTrash size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(connector.id);
                  }}
                >
                  Remove
                </Button>
              </Group>
            </Group>

            {/* Mock Logs Area */}
            <Box style={{ display: 'flex', flexDirection: 'column' }}>
              <Group gap="xs" mb="xs">
                <IconTerminal2 size={16} color="var(--mantine-color-dimmed)" />
                <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.5px' }}>
                  Connection Logs
                </Text>
              </Group>
              <Box className="mock-terminal">
                <Box className="mock-terminal-line">
                  <span className="mock-terminal-time">[10:00:01]</span>
                  <span className="mock-terminal-info">INFO</span>
                  <span>: Establishing SSE connection to {connector.url}...</span>
                </Box>
                <Box className="mock-terminal-line">
                  <span className="mock-terminal-time">[10:00:02]</span>
                  <span className="mock-terminal-success">SUCCESS</span>
                  <span>: Connection established. Handshake complete.</span>
                </Box>
                <Box className="mock-terminal-line">
                  <span className="mock-terminal-time">[10:00:02]</span>
                  <span className="mock-terminal-info">INFO</span>
                  <span>: Discovered tools and prompts from remote server.</span>
                </Box>
                <Box className="mock-terminal-line" style={{ marginTop: '16px' }}>
                  <span className="mock-terminal-time" style={{ opacity: 0.5 }}>Waiting for incoming events...</span>
                </Box>
              </Box>
            </Box>

          </Stack>

        </Box>
      </Collapse>
    </Box>
  );
};

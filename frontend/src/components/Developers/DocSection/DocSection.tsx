import React from 'react';
import { Box, Text, Group, ThemeIcon, Stack, Badge, Code, Anchor } from '@mantine/core';
import {
  IconArrowRight,
  IconBolt,
  IconCode,
  IconKey,
  IconWebhook,
  IconApi,
  IconShieldCheck,
} from '@tabler/icons-react';
import { motion } from 'motion/react';
import './DocSection.css';

interface DocCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  href?: string;
  delay?: number;
}

const DocCard: React.FC<DocCardProps> = ({
  icon,
  title,
  description,
  badge,
  badgeColor = 'violet',
  delay = 0,
}) => (
  <motion.div
    className="doc-card"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut', delay }}
    whileHover={{ y: -2 }}
  >
    <Group justify="space-between" mb="sm">
      <ThemeIcon size={40} radius="md" variant="light" color="violet" className="doc-card-icon">
        {icon}
      </ThemeIcon>
      {badge && (
        <Badge size="xs" variant="light" color={badgeColor}>
          {badge}
        </Badge>
      )}
    </Group>
    <Text fw={700} size="sm" mb={6}>
      {title}
    </Text>
    <Text size="xs" c="dimmed" lh={1.6}>
      {description}
    </Text>
    <Group gap={4} mt="sm" className="doc-card-link">
      <Text size="xs" fw={600} c="violet.4">
        Learn more
      </Text>
      <IconArrowRight size={12} color="var(--mantine-color-violet-4)" />
    </Group>
  </motion.div>
);

interface EndpointRowProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
}

const methodColors: Record<string, string> = {
  GET: 'teal',
  POST: 'violet',
  PUT: 'yellow',
  DELETE: 'red',
};

const EndpointRow: React.FC<EndpointRowProps> = ({ method, path, description }) => (
  <Group className="endpoint-row" wrap="nowrap" gap="md">
    <Badge
      size="xs"
      variant="filled"
      color={methodColors[method]}
      style={{ flexShrink: 0, fontFamily: 'monospace', minWidth: 48, textAlign: 'center' }}
    >
      {method}
    </Badge>
    <Code fz="xs" style={{ flex: 1, minWidth: 0, background: 'transparent', fontFamily: 'monospace' }}>
      {path}
    </Code>
    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }} visibleFrom="sm">
      {description}
    </Text>
  </Group>
);

export const DocSection: React.FC = () => {
  const quickstarts: DocCardProps[] = [
    {
      icon: <IconBolt size={20} stroke={1.5} />,
      title: 'Quickstart',
      description: 'Get up and running with the Atom API in minutes. Authenticate, make your first call, and start building.',
      badge: 'Start here',
      badgeColor: 'green',
      delay: 0,
    },
    {
      icon: <IconKey size={20} stroke={1.5} />,
      title: 'Authentication',
      description: 'Learn how to generate API tokens, manage scopes, and use OAuth 2.0 for secure integrations.',
      badge: 'Auth',
      badgeColor: 'orange',
      delay: 0.05,
    },
    {
      icon: <IconWebhook size={20} stroke={1.5} />,
      title: 'Webhooks',
      description: 'Subscribe to real-time events and stream agent responses directly into your application via webhooks.',
      delay: 0.1,
    },
    {
      icon: <IconShieldCheck size={20} stroke={1.5} />,
      title: 'Rate Limits & Quotas',
      description: 'Understand request limits, plan tiers, and how to handle 429 errors gracefully in production.',
      delay: 0.15,
    },
    {
      icon: <IconApi size={20} stroke={1.5} />,
      title: 'REST API Reference',
      description: 'Full OpenAPI 3.0 specification for all endpoints. Explore request/response schemas interactively.',
      badge: 'v2.1',
      badgeColor: 'violet',
      delay: 0.2,
    },
    {
      icon: <IconCode size={20} stroke={1.5} />,
      title: 'SDK Libraries',
      description: 'Official SDKs for JavaScript, Python, Go, and Rust. Auto-complete, type safety, and examples included.',
      delay: 0.25,
    },
  ];

  const endpoints: EndpointRowProps[] = [
    { method: 'GET', path: '/v2/agents', description: 'List all connected agents' },
    { method: 'POST', path: '/v2/agents/{id}/query', description: 'Run a query against an agent' },
    { method: 'GET', path: '/v2/agents/{id}/usage', description: 'Fetch agent usage statistics' },
    { method: 'POST', path: '/v2/tokens', description: 'Generate a new API token' },
    { method: 'DELETE', path: '/v2/tokens/{id}', description: 'Revoke an API token' },
    { method: 'GET', path: '/v2/projects', description: 'List all workspace projects' },
    { method: 'POST', path: '/v2/projects/{id}/chat', description: 'Send a message to a project chat' },
  ];

  return (
    <Box className="doc-section">
      {/* Quick start cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Group justify="space-between" align="center" mb="md">
          <Stack gap={2}>
            <Text fw={700} size="md">
              Guides &amp; Concepts
            </Text>
            <Text size="xs" c="dimmed">
              Everything you need to integrate with Atom's developer platform
            </Text>
          </Stack>
          <Anchor size="xs" c="violet.4" fw={600} underline="hover">
            View full docs →
          </Anchor>
        </Group>

        <div className="doc-grid">
          {quickstarts.map((card) => (
            <DocCard key={card.title} {...card} />
          ))}
        </div>
      </motion.div>

      {/* API Endpoint reference */}
      <motion.div
        className="endpoint-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Group justify="space-between" align="center" mb="md">
          <Stack gap={2}>
            <Text fw={700} size="md">
              Popular Endpoints
            </Text>
            <Text size="xs" c="dimmed">
              Frequently used REST API routes
            </Text>
          </Stack>
          <Code fz="xs" c="dimmed">
            https://api.atom.inc
          </Code>
        </Group>

        <Box className="endpoint-list">
          {endpoints.map((ep) => (
            <EndpointRow key={`${ep.method}-${ep.path}`} {...ep} />
          ))}
        </Box>
      </motion.div>
    </Box>
  );
};

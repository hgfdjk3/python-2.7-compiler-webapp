import React from 'react';
import { Box, Text, Group, Code, Badge, Anchor, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { DevSubHeader } from '../components/Developers/DevSubHeader/DevSubHeader';
import { motion } from 'motion/react';
import './DevelopersDocs.css';

interface GuideRowProps {
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  delay?: number;
}

const GuideRow: React.FC<GuideRowProps> = ({ title, description, badge, badgeColor = 'violet', delay = 0 }) => (
  <motion.div
    className="guide-row"
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay }}
  >
    <Group justify="space-between" wrap="nowrap" gap="lg">
      <Stack gap={2} style={{ minWidth: 0 }}>
        <Group gap="xs">
          <Text size="sm" fw={600}>
            {title}
          </Text>
          {badge && (
            <Badge size="xs" variant="light" color={badgeColor}>
              {badge}
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      </Stack>
      <Anchor size="xs" c="dimmed" style={{ flexShrink: 0, textDecoration: 'none' }}>
        →
      </Anchor>
    </Group>
  </motion.div>
);

interface EndpointRowProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  delay?: number;
}

const methodColors: Record<string, string> = {
  GET: 'teal',
  POST: 'violet',
  PUT: 'yellow',
  DELETE: 'red',
};

const EndpointRow: React.FC<EndpointRowProps> = ({ method, path, description, delay = 0 }) => (
  <motion.div
    className="endpoint-row"
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay }}
  >
    <Group wrap="nowrap" gap="md">
      <Badge
        size="xs"
        variant="filled"
        color={methodColors[method]}
        style={{ flexShrink: 0, fontFamily: 'monospace', minWidth: 52, justifyContent: 'center' }}
      >
        {method}
      </Badge>
      <Code fz={11} style={{ flex: 1, minWidth: 0, background: 'transparent', padding: 0 }}>
        {path}
      </Code>
      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }} visibleFrom="sm">
        {description}
      </Text>
    </Group>
  </motion.div>
);

export const DevelopersDocsPage: React.FC = () => {
  const guides: GuideRowProps[] = [
    { title: 'Quickstart', description: 'Authenticate and make your first API call in minutes', badge: 'Start here', badgeColor: 'green', delay: 0.05 },
    { title: 'Authentication', description: 'API tokens, OAuth 2.0 scopes and security best practices', badge: 'Auth', badgeColor: 'orange', delay: 0.08 },
    { title: 'Webhooks', description: 'Subscribe to real-time events and stream agent responses', delay: 0.11 },
    { title: 'Rate Limits & Quotas', description: 'Understand request limits and handling 429 errors', delay: 0.14 },
    { title: 'REST API Reference', description: 'Full OpenAPI 3.0 spec with interactive schema explorer', badge: 'v2.1', delay: 0.17 },
    { title: 'SDK Libraries', description: 'TypeScript, Python, Go and Rust — type-safe and documented', delay: 0.2 },
  ];

  const endpoints: EndpointRowProps[] = [
    { method: 'GET', path: '/v2/agents', description: 'List connected agents', delay: 0.05 },
    { method: 'POST', path: '/v2/agents/{id}/query', description: 'Query an agent', delay: 0.08 },
    { method: 'GET', path: '/v2/agents/{id}/usage', description: 'Usage statistics', delay: 0.11 },
    { method: 'POST', path: '/v2/tokens', description: 'Generate API token', delay: 0.14 },
    { method: 'DELETE', path: '/v2/tokens/{id}', description: 'Revoke token', delay: 0.17 },
    { method: 'GET', path: '/v2/projects', description: 'List projects', delay: 0.2 },
    { method: 'POST', path: '/v2/projects/{id}/chat', description: 'Send message', delay: 0.23 },
  ];

  return (
    <ProjectLayout>
      <Box className="dev-sub-root">
        <Box className="dev-sub-content">
          <DevSubHeader title="Documentation" backTo="/developers" />

          {/* Guides */}
          <Box mb={40}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="md" style={{ letterSpacing: '0.6px' }}>
              Guides
            </Text>
            <Box className="row-list">
              {guides.map((g) => (
                <GuideRow key={g.title} {...g} />
              ))}
            </Box>
          </Box>

          {/* Endpoints */}
          <Box>
            <Group justify="space-between" mb="md">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.6px' }}>
                Popular Endpoints
              </Text>
              <Code fz={10} c="dimmed">
                api.atom.inc
              </Code>
            </Group>
            <Box className="row-list">
              {endpoints.map((e) => (
                <EndpointRow key={`${e.method}-${e.path}`} {...e} />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </ProjectLayout>
  );
};

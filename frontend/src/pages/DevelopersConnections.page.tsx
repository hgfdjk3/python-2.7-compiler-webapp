import React, { useState } from 'react';
import { Box, Text, Group, Anchor, Button, Loader } from '@mantine/core';
import { IconArrowRight, IconPlus } from '@tabler/icons-react';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { DevSubHeader } from '../components/Developers/DevSubHeader/DevSubHeader';
import { AgentRow } from '../components/Developers/AgentRow/AgentRow';
import { AGENTS_DIRECTORY, AgentInfo } from '../utils/agentUtils';
import { useConnectors, useAddConnector, ConnectorFormData } from '../api/connectors';
import { AddConnectorModal } from '../components/Developers/AddConnectorModal/AddConnectorModal';
import { IconServer } from '@tabler/icons-react';
import './DevelopersConnections.css';

const ENABLED_AGENTS = new Set(['github']);

export const DevelopersConnectionsPage: React.FC = () => {
  const [modalOpened, setModalOpened] = useState(false);

  const { data: dynamicConnectors = [], isLoading } = useConnectors();
  const addConnectorMutation = useAddConnector();

  // Map dynamic connectors to AgentInfo
  const dynamicAgents: AgentInfo[] = dynamicConnectors.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || `Dynamic MCP connection to ${c.url}`,
    developer: 'Custom Connection',
    category: 'Dynamic MCP',
    brandColor: c.color || '#6366F1',
    icon: <IconServer size={24} stroke={1.5} />,
    sourcesAdded: ['Dynamic Tools'],
    toolsEnabled: ['Remote Execution']
  }));

  // Combine static enabled agents and dynamic agents
  const staticActive = AGENTS_DIRECTORY.filter((a) => ENABLED_AGENTS.has(a.id));
  const active = [...staticActive, ...dynamicAgents];

  const staticInactive = AGENTS_DIRECTORY.filter((a) => !ENABLED_AGENTS.has(a.id));
  const inactive = staticInactive;

  const handleAddConnector = async (data: ConnectorFormData) => {
    await addConnectorMutation.mutateAsync(data);
  };

  return (
    <ProjectLayout>
      <Box className="dev-sub-root">
        <Box className="dev-sub-content">
          <Group justify="space-between" align="flex-start" mb="lg">
            <DevSubHeader title="Agent Connections" backTo="/developers" />
            <Button
              leftSection={<IconPlus size={16} />}
              color="indigo"
              variant="light"
              onClick={() => setModalOpened(true)}
            >
              Add Connection
            </Button>
          </Group>

          {isLoading ? (
            <Group justify="center" mt={40}>
              <Loader color="indigo" type="dots" />
            </Group>
          ) : (
            <>
              {/* Active */}
              {active.length > 0 && (
                <Box mb={40}>
                  <Group justify="space-between" mb="md">
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.6px' }}>
                      Active · {active.length}
                    </Text>
                  </Group>
                  {active.map((agent, i) => (
                    <AgentRow key={agent.id} agent={agent} status="enabled" delay={i * 0.04} />
                  ))}
                </Box>
              )}

              {/* Inactive */}
              {inactive.length > 0 && (
                <Box>
                  <Group justify="space-between" mb="md">
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.6px', opacity: 0.6 }}>
                      Inactive · {inactive.length}
                    </Text>
                    <Anchor
                      size="xs"
                      c="dimmed"
                      href="/agents"
                      style={{ textDecoration: 'none' }}
                    >
                      <Group gap={4}>
                        Browse marketplace
                        <IconArrowRight size={12} />
                      </Group>
                    </Anchor>
                  </Group>
                  <Box style={{ opacity: 0.5 }}>
                    {inactive.map((agent, i) => (
                      <AgentRow
                        key={agent.id}
                        agent={agent}
                        status="disabled"
                        delay={active.length * 0.04 + i * 0.03}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      <AddConnectorModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onAdd={handleAddConnector}
      />
    </ProjectLayout>
  );
};

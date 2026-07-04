import React, { useState, useMemo } from 'react';
import { Box, Title, Text, Stack } from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { useAgentInfo } from '../../utils/agentUtils';
import { useUserConfig, useUpdateUserConfig } from '../../api/user';
import { AgentCard } from '../Agents/AgentCard';
import { AgentModal } from '../Agents/AgentModal';
import '@mantine/carousel/styles.css';
import './OnboardingConnectorsStep.css';

export const OnboardingConnectorsStep: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const { agents } = useAgentInfo();
  const { data: userConfig } = useUserConfig();
  const updateUserConfigMutation = useUpdateUserConfig();

  const agentStatuses = useMemo(() => {
    const statuses: Record<string, 'enabled' | 'disabled'> = {};
    if (userConfig?.enabled_connectors) {
      agents.forEach(a => {
        statuses[a.id] = userConfig.enabled_connectors.includes(a.id) ? 'enabled' : 'disabled';
      });
    }
    return statuses;
  }, [userConfig, agents]);

  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    const agent = agents.find(a => a.id === selectedAgentId);
    if (!agent) return null;
    return {
      ...agent,
      header_values: userConfig?.header_values?.[selectedAgentId] || {},
    };
  }, [selectedAgentId, agents, userConfig]);

  const handleToggleStatus = async (id: string) => {
    if (!userConfig) return;
    const isEnabled = agentStatuses[id] === 'enabled';
    const newEnabled = isEnabled
      ? userConfig.enabled_connectors.filter(c => c !== id)
      : [...userConfig.enabled_connectors, id];

    try {
      await updateUserConfigMutation.mutateAsync({
        enabled_connectors: newEnabled,
        header_values: userConfig.header_values || {},
      });
    } catch (error) {
      console.error('Failed to update connector status in onboarding:', error);
    }
  };

  const handleUpdateConfig = async (id: string, header_values: Record<string, string>) => {
    if (!userConfig) return;

    const newHeaders = { ...userConfig.header_values, [id]: header_values };
    const newEnabled = userConfig.enabled_connectors.includes(id)
      ? userConfig.enabled_connectors
      : [...userConfig.enabled_connectors, id];

    try {
      await updateUserConfigMutation.mutateAsync({
        enabled_connectors: newEnabled,
        header_values: newHeaders,
      });
    } catch (error) {
      console.error('Failed to update connector configuration in onboarding:', error);
    }
  };

  return (
    <Stack gap="md" h="100%">
      <Box>
        <Title className="onboarding-connectors-title" mb="xs">
          Enable Connectors
        </Title>
        <Text c="zinc.4" size="sm" style={{ lineHeight: 1.5 }}>
          Activate your first set of tools. Click to enable or disable them instantly.
        </Text>
      </Box>

      {agents.length > 0 ? (
        <Carousel
          withControls={agents.length > 2}
          slideSize="50%"
          h="100%"
          slideGap="md"
          className="onboarding-carousel"
          styles={{
            viewport: {
              height: 'auto',
            },
            control: {
              backgroundColor: 'light-dark(var(--mantine-color-zinc-2), var(--mantine-color-zinc-8))',
              borderColor: 'light-dark(var(--mantine-color-zinc-3), var(--mantine-color-zinc-7))',
              color: 'light-dark(var(--mantine-color-zinc-8), var(--mantine-color-white))',
              opacity: 0.8,
              '&:hover': {
                backgroundColor: 'light-dark(var(--mantine-color-zinc-3), var(--mantine-color-zinc-7))',
                opacity: 1,
              }
            }
          }}
        >
          {agents.map((agent) => (
            <Carousel.Slide key={agent.id}>
              <div style={{ height: '100%' }}>
                <AgentCard
                  agent={agent}
                  status={agentStatuses[agent.id] || 'disabled'}
                  onClick={() => setSelectedAgentId(agent.id)}
                />
              </div>
            </Carousel.Slide>
          ))}
        </Carousel>
      ) : (
        <Box py="xl" style={{ textAlign: 'center' }}>
          <Text size="sm" c="zinc.5" fs="italic">
            Loading available connectors...
          </Text>
        </Box>
      )}

      {/* Detail agent connection configuration/view drawer */}
      <AgentModal
        agent={selectedAgent}
        status={selectedAgent ? (agentStatuses[selectedAgent.id] || 'disabled') : 'disabled'}
        opened={!!selectedAgent}
        onClose={() => setSelectedAgentId(null)}
        onToggleStatus={handleToggleStatus}
        onUpdateConfig={handleUpdateConfig}
      />
    </Stack>
  );
};

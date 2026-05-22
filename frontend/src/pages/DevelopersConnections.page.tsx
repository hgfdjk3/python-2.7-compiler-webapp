import React, { useState } from 'react';
import { Box, Text, Group, Button, Loader } from '@mantine/core';
import { IconPlus, IconPlugConnected } from '@tabler/icons-react';
import { ProjectLayout } from '../components/Layout/ProjectLayout';
import { DevSubHeader } from '../components/Developers/DevSubHeader/DevSubHeader';
import { useConnectors, useAddConnector, useUpdateConnector, useDeleteConnector, ConnectorFormData } from '../api/connectors';
import { ConnectorModal } from '../components/Developers/ConnectorModal/ConnectorModal';
import { ConnectorRow } from '../components/Developers/ConnectorRow/ConnectorRow';
import './DevelopersConnections.css';

export const DevelopersConnectionsPage: React.FC = () => {
  const [modalOpened, setModalOpened] = useState(false);
  const [editingConnector, setEditingConnector] = useState<ConnectorFormData | null>(null);

  const { data: dynamicConnectors = [], isLoading } = useConnectors();
  const addConnectorMutation = useAddConnector();
  const updateConnectorMutation = useUpdateConnector();
  const deleteConnectorMutation = useDeleteConnector();

  const handleOpenAdd = () => {
    setEditingConnector(null);
    setModalOpened(true);
  };

  const handleOpenEdit = (connector: ConnectorFormData) => {
    setEditingConnector(connector);
    setModalOpened(true);
  };

  const handleSubmit = async (data: ConnectorFormData) => {
    if (editingConnector) {
      await updateConnectorMutation.mutateAsync({ id: editingConnector.id, data });
    } else {
      await addConnectorMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this connection?')) {
      await deleteConnectorMutation.mutateAsync(id);
    }
  };

  return (
    <ProjectLayout>
      <Box className="dev-sub-root">
        <Box className="dev-sub-content">
          <Group justify="space-between" align="flex-start" mb="xl">
            <DevSubHeader title="Your Connections" backTo="/developers" />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleOpenAdd}
            >
              Add Connection
            </Button>
          </Group>

          {isLoading ? (
            <Group justify="center" mt={40}>
              <Loader color="gray" type="dots" />
            </Group>
          ) : dynamicConnectors.length === 0 ? (
            <Box mt={60} style={{ textAlign: 'center' }}>
              <IconPlugConnected size={48} color="var(--mantine-color-dimmed)" stroke={1.5} style={{ opacity: 0.5 }} />
              <Text mt="md" size="lg" fw={600}>No custom connections</Text>
              <Text size="sm" c="dimmed" mt={4} mb="xl">
                You haven't added any custom Model Context Protocol connections yet.
              </Text>
              <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAdd}>
                Add Your First Connection
              </Button>
            </Box>
          ) : (
            <Box mb={40}>
              <Group justify="space-between" mb="md">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.6px' }}>
                  Added by you · {dynamicConnectors.length}
                </Text>
              </Group>

              <Box>
                {dynamicConnectors.map((connector) => (
                  <ConnectorRow
                    key={connector.id}
                    connector={connector}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <ConnectorModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleSubmit}
        initialData={editingConnector}
      />
    </ProjectLayout>
  );
};

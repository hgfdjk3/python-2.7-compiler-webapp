import React from 'react';
import { Stack, Title, Text, Group, Button, ScrollArea, Box, Table, ActionIcon, Tooltip } from '@mantine/core';
import { IconCheck, IconX, IconPlayerSkipForward } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { ApprovalDiffViewer } from './ApprovalDiffViewer';
import { Entity, EntityConnection } from '../../../api/library';
import { getSourceStyle } from '../Sources/sourceTypes';

interface EntityApprovalStepProps {
  projectId: string;
  entity: Entity;
}

const formatConnections = (connections: EntityConnection[] = []) => {
  if (!connections || connections.length === 0) return 'No connections';
  return connections.map(c => `- ${c.entity_id} (${c.connection_type})`).join('\n');
};

export const EntityApprovalStep: React.FC<EntityApprovalStepProps> = ({
  projectId,
  entity,
}) => {

  const currentTitle = entity.current_state?.title || '';
  const proposedTitle = entity.proposed_state?.title || '';

  const currentDesc = entity.current_state?.description || '';
  const proposedDesc = entity.proposed_state?.description || '';

  const currentConnections = formatConnections(entity.current_state?.related_entities);
  const proposedConnections = formatConnections(entity.proposed_state?.related_entities);

  const isNewEntity = !entity.current_state && !!entity.proposed_state;
  const sourceStyle = getSourceStyle(entity.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Stack gap="md">
        <Box>
          <Group gap="xs" mb="xs" justify='space-between'>
            <Group align='baseline' gap='xs'>
              <Title fw={300} order={5}>Source</Title>
              <Title order={3}>
                {proposedTitle || currentTitle || 'Source'}
              </Title>
            </Group>
            <Group gap='5'>
              <Box c={sourceStyle.color} style={{ display: 'flex', alignItems: 'center' }}>
                {sourceStyle.icon}
              </Box>
              <Text size="sm" fw={500} c={sourceStyle.color} tt="uppercase">
                {entity.type}
              </Text>
              <Text size="sm" c="dimmed">•</Text>
              <Text size="sm" fw={500}>
                {isNewEntity ? 'New' : 'Update'}
              </Text>
            </Group>
          </Group>
          <Text c="dimmed" size="sm">
            Review the proposed changes for this source.
          </Text>
        </Box>

        <ScrollArea.Autosize mah={500} type="auto" offsetScrollbars>
          <Table verticalSpacing="xs" horizontalSpacing="xs" withRowBorders={true} borderColor="dark.6">
            <Table.Tbody>
              {/* Title Diff */}
              {(currentTitle !== proposedTitle || isNewEntity) && (
                <Table.Tr>
                  <Table.Td w={100} c="dimmed" style={{ verticalAlign: 'top', padding: '8px 0' }}>Title</Table.Td>
                  <Table.Td style={{ padding: '8px 0' }}>
                    <ApprovalDiffViewer oldText={currentTitle} newText={proposedTitle} />
                  </Table.Td>
                </Table.Tr>
              )}

              {/* Description Diff */}
              {(currentDesc !== proposedDesc || isNewEntity) && (
                <Table.Tr>
                  <Table.Td w={100} c="dimmed" style={{ verticalAlign: 'top', padding: '8px 0' }}>Description</Table.Td>
                  <Table.Td style={{ padding: '8px 0' }}>
                    <ApprovalDiffViewer oldText={currentDesc} newText={proposedDesc} />
                  </Table.Td>
                </Table.Tr>
              )}

              {/* Connections Diff */}
              {(currentConnections !== proposedConnections || isNewEntity) && (
                <Table.Tr>
                  <Table.Td w={100} c="dimmed" style={{ verticalAlign: 'top', padding: '8px 0', borderBottom: 'none' }}>Connections</Table.Td>
                  <Table.Td style={{ padding: '8px 0', borderBottom: 'none' }}>
                    <ApprovalDiffViewer oldText={currentConnections} newText={proposedConnections} />
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea.Autosize>
      </Stack>
    </motion.div>
  );
};

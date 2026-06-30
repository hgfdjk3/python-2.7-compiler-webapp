import React from 'react';
import { Paper, Group, Text, Box, Stack, Badge, ScrollArea, Divider, ActionIcon, Tooltip } from '@mantine/core';
import { IconLink } from '@tabler/icons-react';
import { useState } from 'react';
import { Entity } from '../../../../api/library';
import { getSourceStyle } from '../../Sources/sourceTypes';
import { motion } from 'motion/react';

const MotionPaper = motion.create(Paper as any);

import { CreateConnectionModal } from './CreateConnectionModal';

interface NodeInfoPanelProps {
  entity: Entity | null;
}

export const NodeInfoPanel: React.FC<NodeInfoPanelProps> = ({ entity }) => {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  if (!entity) return null;
  const state = entity.current_state || entity.proposed_state;
  if (!state) return null;

  const styleInfo = getSourceStyle(entity.type);
  const cardColor = styleInfo.color;

  return (
    <MotionPaper
      initial={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
      transition={{ duration: 0.2 }}
      shadow="md"
      radius="md"
      p="md"
      withBorder
      style={{
        position: 'absolute',
        top: 82,
        right: 20,
        width: 340,
        maxHeight: 'calc(100% - 90px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9,
        backgroundColor: 'color-mix(in srgb, var(--mantine-color-body) 80%, transparent)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs" pl="xs" pr="xs">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600}>{state.title || entity.type}</Text>
          <Text size="xs" c="dimmed" mt={4}>{state.description || 'No summary available.'}</Text>
        </div>
        <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
          <Badge size="xs" variant="light" color={cardColor}>{entity.type}</Badge>
          <Badge size="xs" color={entity.status === 'approved' ? 'green' : 'yellow'} variant="light">
            {entity.status}
          </Badge>
        </Stack>
      </Group>

      <Divider mb="xs" variant="dashed" />

      <ScrollArea style={{ flex: 1 }} type="scroll" offsetScrollbars>
        <Stack gap="sm" pl="xs" pr="xs" pb="xs">

          {state.related_entities && state.related_entities.length > 0 && (
            <Box>
              <Text size="xs" fw={500} tt="uppercase" c="dimmed" mb={4}>Connections ({state.related_entities.length})</Text>
              <Stack gap={4}>
                {state.related_entities.map((rel, idx) => (
                  <Group key={idx} wrap="nowrap" gap="xs">
                    <Text size="xs" fw={500} style={{ flexShrink: 0 }} c="dimmed">{rel.connection_type}:</Text>
                    <Text size="xs" truncate>{rel.entity_id}</Text>
                  </Group>
                ))}
              </Stack>
            </Box>
          )}

          {/* {state.source_tools && state.source_tools.length > 0 && (
            <Box>
              <Text size="xs" fw={500} tt="uppercase" c="dimmed" mb={4}>Source Tools</Text>
              <Group gap="xs">
                {state.source_tools.map((tool, idx) => (
                  <Badge key={idx} size="xs" variant="outline" color="gray">{tool}</Badge>
                ))}
              </Group>
            </Box>
          )} */}
        </Stack>
      </ScrollArea>
    </MotionPaper>
  );
};

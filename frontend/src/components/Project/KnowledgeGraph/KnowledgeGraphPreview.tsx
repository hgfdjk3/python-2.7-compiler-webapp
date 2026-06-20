import React, { useState } from 'react';
import { Box, Overlay, Center, Text } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { KnowledgeGraphCore } from './KnowledgeGraphCore';
import { IconZoomIn } from '@tabler/icons-react';

export const KnowledgeGraphPreview: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      style={{
        flex: 1,
        minHeight: 0,
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--mantine-color-default-border)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--mantine-color-body) 92%, transparent), var(--mantine-color-default))',
        position: 'relative',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (projectId) {
          navigate(`/project/${projectId}/graph`);
        }
      }}
    >
      <KnowledgeGraphCore projectId={projectId || ''} interactive={false} />
      
      {hovered && (
        <Overlay 
          color="#000" 
          backgroundOpacity={0.3} 
          blur={2} 
          zIndex={5}
        >
          <Center h="100%">
            <Box style={{ textAlign: 'center', color: 'white' }}>
              <IconZoomIn size={32} style={{ marginBottom: 8 }} />
              <Text fw={500} size="sm">Click to expand</Text>
            </Box>
          </Center>
        </Overlay>
      )}
    </Box>
  );
};

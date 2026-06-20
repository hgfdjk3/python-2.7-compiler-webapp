import React, { useState } from 'react';
import { Box, ActionIcon } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { KnowledgeGraphCore } from '../components/Project/KnowledgeGraph/KnowledgeGraphCore';
import { GraphToolbar } from '../components/Project/KnowledgeGraph/Toolbar/GraphToolbar';
import { IconArrowLeft } from '@tabler/icons-react';

export const KnowledgeGraphPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  const handleNodeClick = (nodeId: string, event: MouseEvent) => {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      setSelectedNodeIds(prev => 
        prev.includes(nodeId) 
          ? prev.filter(id => id !== nodeId) 
          : [...prev, nodeId]
      );
    } else {
      setSelectedNodeIds(prev => 
        prev.length === 1 && prev[0] === nodeId ? [] : [nodeId]
      );
    }
  };

  const handleEdit = () => console.log('Edit entity', selectedNodeIds[0]);
  const handleConnect = () => console.log('Connect entities', selectedNodeIds);
  const handleMerge = () => console.log('Merge entities', selectedNodeIds);
  const handleDelete = () => console.log('Delete entities', selectedNodeIds);

  return (
    <Box style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Box style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        <ActionIcon variant="light" color="gray" size="xl" radius="xl" onClick={() => navigate(`/project/${projectId}`)}>
          <IconArrowLeft size={24} />
        </ActionIcon>
      </Box>

      <GraphToolbar
        selectedNodeIds={selectedNodeIds}
        onEdit={handleEdit}
        onConnect={handleConnect}
        onMerge={handleMerge}
        onDelete={handleDelete}
      />

      <Box style={{ flex: 1, minHeight: 0 }}>
        <KnowledgeGraphCore 
          projectId={projectId || ''} 
          interactive={true} 
          selectedNodeIds={selectedNodeIds}
          onNodeClick={handleNodeClick}
        />
      </Box>
    </Box>
  );
};

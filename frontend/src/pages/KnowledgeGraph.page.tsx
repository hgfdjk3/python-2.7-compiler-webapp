import React, { useState, useMemo } from 'react';
import { Box, ActionIcon, Group, useMantineTheme } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { KnowledgeGraphCore } from '../components/Project/KnowledgeGraph/KnowledgeGraphCore';
import { GraphToolbar } from '../components/Project/KnowledgeGraph/Toolbar/GraphToolbar';
import { GraphSearchWidget } from '../components/Project/KnowledgeGraph/Toolbar/GraphSearchWidget';
import { IconArrowLeft } from '@tabler/icons-react';
import { useLibraryEntities } from '../api/library';

export const KnowledgeGraphPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const { data: entities } = useLibraryEntities(projectId || '');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const typeColors: Record<string, string> = {
    document: theme.colors.blue[6],
    entity: theme.colors.grape[6],
    concept: theme.colors.teal[6],
    person: theme.colors.orange[6],
    organization: theme.colors.indigo[6],
    location: theme.colors.red[6],
    event: theme.colors.yellow[6],
    action: theme.colors.green[6],
    default: theme.colors.gray[6]
  };

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
    setFocusedNodeId(null); // Clear manual focus on click
  };

  const handleResultClick = (entityId: string) => {
    setSelectedNodeIds([entityId]);
    setFocusedNodeId(entityId);
  };

  const availableTypes = useMemo(() => {
    if (!entities) return [];
    const types = new Set(entities.map(e => e.type));
    return Array.from(types);
  }, [entities]);

  const handleToggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const highlightedNodeIds = useMemo(() => {
    if (!entities) return undefined;
    if (!searchQuery && selectedTypes.length === 0) return undefined; // undefined = no active highlights

    const query = searchQuery.toLowerCase();
    
    return entities
      .filter(e => {
        const label = (e.current_state?.title || e.proposed_state?.title || e.type).toLowerCase();
        const matchesSearch = query ? label.includes(query) : true;
        const matchesType = selectedTypes.length > 0 ? selectedTypes.includes(e.type) : true;
        return matchesSearch && matchesType;
      })
      .map(e => e.id);
  }, [entities, searchQuery, selectedTypes]);

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

      <Group gap="sm" style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <GraphToolbar
          selectedNodeIds={selectedNodeIds}
          onEdit={handleEdit}
          onConnect={handleConnect}
          onMerge={handleMerge}
          onDelete={handleDelete}
        />
      </Group>

      <GraphSearchWidget
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        availableTypes={availableTypes}
        selectedTypes={selectedTypes}
        onToggleType={handleToggleType}
        entities={entities || []}
        typeColors={typeColors}
        onResultClick={handleResultClick}
      />

      <Box style={{ flex: 1, minHeight: 0 }}>
        <KnowledgeGraphCore 
          projectId={projectId || ''} 
          interactive={true} 
          selectedNodeIds={selectedNodeIds}
          highlightedNodeIds={highlightedNodeIds}
          focusedNodeId={focusedNodeId}
          onNodeClick={handleNodeClick}
        />
      </Box>
    </Box>
  );
};
